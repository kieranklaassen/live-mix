// The convolution lesson's own check, made in the reader's browser on every render: the loop
// and the impulse the lab used go through the browser's convolver, and what comes out is set
// against the lab's own convolution.

import { useEffect, useState } from 'react'
import { convolveLoop, differenceDb } from '../lab/convolution.ts'
import { useLab } from '../lab/page.ts'
import type { Source } from '../lab/runner.ts'
import type { Tap } from '../lab/store.ts'
import { withUnit } from './draw.ts'

const stereo = (tap: Tap | undefined): Source | undefined => {
  const left = tap?.channels_data[0]
  return left && left.length > 0 ? { left, right: tap.channels_data[1] ?? left } : undefined
}

type Answer = { db: number } | { failed: string } | undefined

export default function ConvolverCheck({
  source,
  impulse,
  result,
}: {
  source: string
  impulse: string
  result: string
}) {
  const taps = useLab().result?.taps
  const [answer, setAnswer] = useState<Answer>()

  useEffect(() => {
    const loop = stereo(taps?.[source])
    const room = stereo(taps?.[impulse])
    const own = stereo(taps?.[result])
    if (!loop || !room || !own) return
    let current = true
    // A control being dragged renders many times a second: only the render it rests on is checked.
    const timer = setTimeout(() => {
      convolveLoop(loop, room).then(
        (theirs) => current && setAnswer({ db: differenceDb(own, theirs) }),
        (error: unknown) =>
          current && setAnswer({ failed: error instanceof Error ? error.message : String(error) }),
      )
    }, 250)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [taps, source, impulse, result])

  return (
    <p
      className="check"
      data-convolver={answer && 'db' in answer ? answer.db.toFixed(1) : undefined}
      data-convolver-failed={answer && 'failed' in answer ? '' : undefined}
    >
      <span className="label">Checked in your browser</span>
      <span>
        The lab's convolution against the browser's own convolver, which is what the engine uses:{' '}
        <b>
          {answer === undefined
            ? '…'
            : 'db' in answer
              ? withUnit(answer.db, 'dB')
              : `could not be checked here (${answer.failed})`}
        </b>
      </span>
    </p>
  )
}
