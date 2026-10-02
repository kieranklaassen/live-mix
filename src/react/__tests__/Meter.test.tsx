// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { dbToGain } from '../../core/devices/native/units'
import { dbToMeterPosition } from '../components/control-math'
import { Meter, meterInfo } from '../components/Meter'
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

  it('`look="bars"` is the default and changes nothing', () => {
    const level = reading({ peak: dbToGain(-3), rms: dbToGain(-9), peakDb: -3 })
    const plain = render(<Meter reading={level} data-testid="m" />)
    expect(plain.container.firstChild).not.toHaveClass('lm-meter--segments')
    expect(plain.container.querySelector('.lm-meter__clip')).toBeNull()
    expect(
      plain.container.querySelector<HTMLElement>('.lm-meter')?.getAttribute('style'),
    ).toBeNull()
    const html = plain.container.innerHTML
    cleanup()
    expect(
      render(<Meter reading={level} look="bars" warmDb={-20} data-testid="m" />).container
        .innerHTML,
    ).toBe(html)
  })

  it('draws segments: whole fills cut to the level, zones fixed to the scale', () => {
    const { container } = render(
      <Meter
        reading={reading({ peak: dbToGain(-3), rms: dbToGain(-20), peakDb: -3 })}
        look="segments"
        style={{ width: 20 }}
      />,
    )
    const meter = container.querySelector<HTMLElement>('.lm-meter')
    expect(meter).toHaveClass('lm-meter--vertical', 'lm-meter--segments')
    expect(meter?.style.getPropertyValue('--lm-meter-warm-at')).toBe(
      `${dbToMeterPosition(-12) * 100}%`,
    )
    expect(meter?.style.getPropertyValue('--lm-meter-hot-at')).toBe(
      `${dbToMeterPosition(-6) * 100}%`,
    )
    expect(meter?.style.width).toBe('20px')
    const peak = container.querySelector<HTMLElement>('.lm-meter__fill--peak')
    expect(peak?.style.height).toBe('')
    expect(peak?.getAttribute('style')).toBe(
      `clip-path: inset(${(1 - dbToMeterPosition(-3)) * 100}% 0 0 0);`,
    )
    expect(container.querySelector('.lm-meter__fill--rms')?.getAttribute('style')).toBe(
      `clip-path: inset(${(1 - dbToMeterPosition(-20)) * 100}% 0 0 0);`,
    )
    // Above `hotDb` the zones say so; the whole bar is not recoloured.
    expect(peak).not.toHaveClass('lm-meter__fill--hot')
    expect(container.querySelector<HTMLElement>('.lm-meter__hold')?.style.bottom).toBe(
      `${dbToMeterPosition(-3) * 100}%`,
    )
  })

  it('places the zones from `warmDb`, `hotDb` and the floor, and cuts sideways when horizontal', () => {
    const { container } = render(
      <Meter
        reading={reading({
          peak: dbToGain(-10),
          rms: dbToGain(-20),
          peakDb: -10,
          hasLufs: true,
          lufsShortTerm: -14,
          truePeakDb: -9,
        })}
        look="segments"
        orientation="horizontal"
        warmDb={-18}
        hotDb={-3}
        floorDb={-48}
      />,
    )
    const meter = container.querySelector<HTMLElement>('.lm-meter')
    expect(meter).toHaveClass('lm-meter--horizontal', 'lm-meter--segments')
    expect(meter?.style.getPropertyValue('--lm-meter-warm-at')).toBe(
      `${dbToMeterPosition(-18, -48) * 100}%`,
    )
    expect(meter?.style.getPropertyValue('--lm-meter-hot-at')).toBe(
      `${dbToMeterPosition(-3, -48) * 100}%`,
    )
    expect(container.querySelector('.lm-meter__fill--peak')?.getAttribute('style')).toBe(
      `clip-path: inset(0 ${(1 - dbToMeterPosition(-10, -48)) * 100}% 0 0);`,
    )
    // Loudness keeps its own scale.
    expect(container.querySelector('.lm-meter__fill--lufs')?.getAttribute('style')).toBe(
      `clip-path: inset(0 ${(1 - dbToMeterPosition(-14, -40)) * 100}% 0 0);`,
    )
    expect(container.querySelector<HTMLElement>('.lm-meter__hold')?.style.left).toBe(
      `${dbToMeterPosition(-10, -48) * 100}%`,
    )
  })

  it('lights the clip lamp at 0 dB and keeps it lit until the meter is clicked', () => {
    const quiet = reading({ peak: dbToGain(-20), peakDb: -20 })
    const { container, rerender } = render(
      <Meter reading={quiet} look="segments" data-testid="out" />,
    )
    const lamp = screen.getByTestId('out-clip')
    expect(lamp).toHaveClass('lm-meter__clip')
    expect(lamp.parentElement).toHaveClass('lm-meter__bars')
    expect(lamp).not.toHaveAttribute('data-on')

    rerender(<Meter reading={reading({ peak: 1, peakDb: 0 })} look="segments" data-testid="out" />)
    expect(lamp).toHaveAttribute('data-on')
    expect(container.firstChild).toHaveClass('lm-meter--clip')
    rerender(<Meter reading={quiet} look="segments" data-testid="out" />)
    expect(lamp).toHaveAttribute('data-on')
    expect(container.firstChild).not.toHaveClass('lm-meter--clip')

    fireEvent.click(screen.getByRole('meter'))
    expect(lamp).not.toHaveAttribute('data-on')

    // A true peak over 0 lights it as well, and 0 dBTP itself does not.
    rerender(
      <Meter
        reading={{ ...quiet, hasLufs: true, truePeakDb: 0 }}
        look="segments"
        data-testid="out"
      />,
    )
    expect(lamp).not.toHaveAttribute('data-on')
    rerender(
      <Meter
        reading={{ ...quiet, hasLufs: true, truePeakDb: 0.3 }}
        look="segments"
        data-testid="out"
      />,
    )
    expect(lamp).toHaveAttribute('data-on')
  })

  it('forgets a clip when the reading goes away, and has no lamp id without a test id', () => {
    const fixture = createTestEngine()
    const { container, rerender } = render(
      <Meter reading={reading({ peak: 1, peakDb: 0 })} look="segments" />,
      { wrapper: fixture.wrapper },
    )
    const lamp = container.querySelector('.lm-meter__clip')
    expect(lamp).toHaveAttribute('data-on')
    expect(lamp).not.toHaveAttribute('data-testid')
    rerender(<Meter look="segments" />)
    expect(container.querySelector('.lm-meter__clip')).not.toHaveAttribute('data-on')
    rerender(<Meter reading={reading({ peak: dbToGain(-20), peakDb: -20 })} look="segments" />)
    expect(container.querySelector('.lm-meter__clip')).not.toHaveAttribute('data-on')
  })

  it('says the three zones and the lamp in the info text of the segments look', () => {
    expect(meterInfo(['peak'], -6)).toBe(
      'How loud the signal is here. The bar shows the peak, with a mark that holds the highest one for a moment. Above -6 dB it changes colour; at 0 dB the signal clips.',
    )
    expect(meterInfo(['peak'], -6, -12)).toBe(
      'How loud the signal is here. The bar shows the peak, with a mark that holds the highest one for a moment. The scale has three zones: up to -12 dB, from -12 to -6 dB, and above -6 dB, each in its own colour. At 0 dB the signal clips, and the lamp at the end stays lit until the meter is clicked.',
    )
    render(<Meter reading={reading()} look="segments" warmDb={-18} bars={['peak']} />)
    expect(screen.getByRole('meter').getAttribute('data-lm-info')).toBe(
      meterInfo(['peak'], -6, -18),
    )
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
