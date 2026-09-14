// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TransportBar } from '../components/TransportBar'
import { createTestEngine } from './harness'

afterEach(cleanup)

describe('TransportBar', () => {
  it('plays, pauses, stops and shows the position', () => {
    const fixture = createTestEngine()
    const { transport } = fixture.engine
    render(<TransportBar data-testid="t" />, { wrapper: fixture.wrapper })
    expect(screen.getByRole('toolbar', { name: 'Transport' })).toHaveClass('lm-transport--stopped')
    expect(screen.getByLabelText('Position')).toHaveTextContent('0:00.0')

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(transport.state).toBe('playing')
    expect(screen.getByRole('button', { name: 'Pause' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('toolbar')).toHaveClass('lm-transport--playing')

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(transport.state).toBe('paused')

    act(() => transport.seek(65.25))
    expect(screen.getByLabelText('Position')).toHaveTextContent('1:05.2')

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(transport.state).toBe('stopped')
    expect(screen.getByLabelText('Position')).toHaveTextContent('0:00.0')
  })

  it('samples the playhead on frames while playing', () => {
    const fixture = createTestEngine()
    const { transport } = fixture.engine
    render(<TransportBar />, { wrapper: fixture.wrapper })
    act(() => transport.start())
    fixture.ctx.currentTime = 2.5
    act(() => fixture.frames.flush(1000))
    expect(screen.getByLabelText('Position')).toHaveTextContent('0:02.5')
  })

  it('toggles the loop and shows its length', () => {
    const fixture = createTestEngine()
    const { transport } = fixture.engine
    render(<TransportBar />, { wrapper: fixture.wrapper })
    act(() => transport.setLoop({ lengthSec: 8 }))
    const loop = screen.getByRole('button', { name: 'Loop' })
    expect(loop).toHaveAttribute('aria-pressed', 'false')
    expect(loop).toHaveTextContent('0:08.0')
    fireEvent.click(loop)
    expect(transport.loop.enabled).toBe(true)
    expect(loop).toHaveAttribute('aria-pressed', 'true')
  })

  it('binds an explicit transport without a provider and hides optional controls', () => {
    const fixture = createTestEngine()
    render(
      <TransportBar transport={fixture.engine.transport} showStop={false} showLoop={false}>
        <span>extra</span>
      </TransportBar>,
    )
    expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Loop' })).toBeNull()
    expect(screen.getByText('extra')).toBeInTheDocument()
  })
})
