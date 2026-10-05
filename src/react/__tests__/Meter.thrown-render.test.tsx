// @vitest-environment jsdom
// A render React throws away (a transition that suspends, then is given up) must leave nothing of
// the source it was for in the meter that is on the page: a meter that is not active reads its
// source once, so whatever such a render left behind would be shown for good.
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render } from '@testing-library/react'
import { Suspense, startTransition, use, useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { Meter as AnalyserMeter } from '../../core/analysis/Meter'
import { dbToGain } from '../../core/devices/native/units'
import { asAudioContext } from '../../testing'
import { Meter } from '../components/Meter'
import { type MeterSource } from '../hooks/useMeter'
import { createTestEngine } from './harness'

afterEach(cleanup)

describe('a meter whose render with another source React threw away', () => {
  it('still shows the source it is on', async () => {
    const fixture = createTestEngine()
    const first: MeterSource = fixture.engine.master
    const other = new AnalyserMeter(asAudioContext(fixture.ctx))
    fixture.ctx.analysers[0].level = dbToGain(-6)
    fixture.ctx.analysers[fixture.ctx.analysers.length - 1].level = dbToGain(-20)

    const never = new Promise<void>(() => {})
    function Gate({ shut }: { shut: boolean }) {
      if (shut) use(never)
      return null
    }
    interface Shown {
      source: MeterSource
      shut: boolean
      tick: number
    }
    let show: (next: Shown) => void = () => {}
    function Page() {
      const [shown, setShown] = useState<Shown>({ source: first, shut: false, tick: 0 })
      show = setShown
      return (
        <Suspense fallback={<p>wait</p>}>
          <Meter source={shown.source} active={false} />
          <Gate shut={shown.shut} />
          <i data-tick={shown.tick} />
        </Suspense>
      )
    }
    const { container } = render(<Page />, { wrapper: fixture.wrapper })
    const peak = (): Element | null => container.querySelector('.lm-meter__bar--peak')
    expect(peak()).toHaveAttribute('data-db', '-6.0')

    // Another source, in a transition that suspends: React keeps the page as it is.
    await act(async () => {
      startTransition(() => show({ source: other, shut: true, tick: 1 }))
      await Promise.resolve()
    })
    expect(container.querySelector('p')).toBeNull()
    expect(container.querySelector('i')).toHaveAttribute('data-tick', '0')
    expect(peak()).toHaveAttribute('data-db', '-6.0')

    // The transition is given up: the page is asked for the first source again, at once.
    await act(async () => {
      show({ source: first, shut: false, tick: 2 })
      await Promise.resolve()
    })
    expect(container.querySelector('i')).toHaveAttribute('data-tick', '2')
    // The meter was never on the other source in anything React committed.
    expect(peak()).toHaveAttribute('data-db', '-6.0')
  })
})
