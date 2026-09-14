// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { dbToGain } from '../../core/devices/native/units'
import { dbToMeterPosition } from '../components/control-math'
import { Meter } from '../components/Meter'
import { type MeterSnapshot } from '../hooks/useMeter'
import { createTestEngine } from './harness'

afterEach(cleanup)

function reading(overrides: Partial<MeterSnapshot> = {}): MeterSnapshot {
  return {
    peak: 0,
    rms: 0,
    peakDb: -Infinity,
    lufs: null,
    lufsShortTerm: -Infinity,
    truePeakDb: -Infinity,
    hasMeter: true,
    hasLufs: false,
    ...overrides,
  }
}

function fillHeight(container: HTMLElement, kind: string): string | undefined {
  return container.querySelector<HTMLElement>(`.lm-meter__fill--${kind}`)?.style.height
}

describe('Meter', () => {
  it('draws peak and RMS bars on the dB scale from an explicit reading', () => {
    const peak = dbToGain(-12)
    const rms = dbToGain(-20)
    const { container } = render(
      <Meter reading={reading({ peak, rms, peakDb: -12 })} label="Pad level" />,
    )
    const meter = screen.getByRole('meter', { name: 'Pad level' })
    expect(meter).toHaveAttribute('aria-valuemin', '-60')
    expect(meter).toHaveAttribute('aria-valuemax', '0')
    expect(meter).toHaveAttribute('aria-valuenow', '-12')
    expect(meter).toHaveAttribute('aria-valuetext', '-12.0 dBFS')
    expect(container.querySelectorAll('.lm-meter__bar')).toHaveLength(2)
    expect(fillHeight(container, 'peak')).toBe(`${dbToMeterPosition(-12) * 100}%`)
    expect(fillHeight(container, 'rms')).toBe(`${dbToMeterPosition(-20) * 100}%`)
    expect(container.querySelector('.lm-meter__fill--peak')).not.toHaveClass('lm-meter__fill--hot')
    expect(screen.getByText('-12.0')).toHaveClass('lm-meter__value--peak')
  })

  it('goes hot above the threshold, flags clipping, and adds LUFS bars when present', () => {
    const { container } = render(
      <Meter
        reading={reading({
          peak: 1,
          rms: 0.7,
          peakDb: 0,
          hasLufs: true,
          lufsShortTerm: -14,
          truePeakDb: 0.5,
        })}
      />,
    )
    expect(container.firstChild).toHaveClass('lm-meter--clip')
    expect(container.querySelectorAll('.lm-meter__bar')).toHaveLength(4)
    expect(container.querySelector('.lm-meter__fill--peak')).toHaveClass('lm-meter__fill--hot')
    expect(fillHeight(container, 'lufs')).toBe(`${dbToMeterPosition(-14, -40) * 100}%`)
    expect(fillHeight(container, 'truePeak')).toBe('100%')
    expect(screen.getByText('-14.0 LU')).toBeInTheDocument()
  })

  it('keeps a peak-hold marker until the hold time passes', () => {
    const { container, rerender } = render(
      <Meter reading={reading({ peak: dbToGain(-6), rms: 0, peakDb: -6 })} holdMs={1000} />,
    )
    rerender(
      <Meter reading={reading({ peak: dbToGain(-30), rms: 0, peakDb: -30 })} holdMs={1000} />,
    )
    const hold = container.querySelector<HTMLElement>('.lm-meter__hold')
    expect(hold?.style.bottom).toBe(`${dbToMeterPosition(-6) * 100}%`)
    expect(screen.getByText('-6.0')).toBeInTheDocument()
    rerender(<Meter reading={reading({ peak: dbToGain(-30), rms: 0, peakDb: -30 })} holdMs={0} />)
    expect(container.querySelector('.lm-meter__hold')).toBeNull()
  })

  it('renders horizontally with widths and without a readout', () => {
    const { container } = render(
      <Meter
        reading={reading({ peak: 1, peakDb: 0 })}
        orientation="horizontal"
        showReadout={false}
        bars={['peak']}
      />,
    )
    expect(container.firstChild).toHaveClass('lm-meter--horizontal')
    expect(container.querySelector<HTMLElement>('.lm-meter__fill--peak')?.style.width).toBe('100%')
    expect(container.querySelector('.lm-meter__readout')).toBeNull()
  })

  it('reads a live source through useMeter on frames', () => {
    const fixture = createTestEngine()
    const { container } = render(<Meter source={fixture.engine.master} />, {
      wrapper: fixture.wrapper,
    })
    expect(fillHeight(container, 'peak')).toBe('0%')
    fixture.ctx.analysers[0].level = dbToGain(-6)
    act(() => fixture.frames.flush(1000))
    // The analyser hands back float32 samples, so compare within a rounding error.
    expect(Number.parseFloat(fillHeight(container, 'peak') ?? '')).toBeCloseTo(
      dbToMeterPosition(-6) * 100,
      3,
    )
    expect(container.querySelector('.lm-meter__fill--peak')).not.toHaveClass('lm-meter__fill--hot')
    fixture.ctx.analysers[0].level = dbToGain(-3)
    act(() => fixture.frames.flush(2000))
    expect(container.querySelector('.lm-meter__fill--peak')).toHaveClass('lm-meter__fill--hot')
  })

  it('defaults to the provided engine master', () => {
    const fixture = createTestEngine()
    render(<Meter />, { wrapper: fixture.wrapper })
    expect(screen.getByRole('meter', { name: 'Level' })).toBeInTheDocument()
  })
})
