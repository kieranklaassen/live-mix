// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Profiler } from 'react'
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

  it('shows where the playhead is from the first frame of playing, not where it last ran', () => {
    const fixture = createTestEngine()
    const { transport } = fixture.engine
    const drawn: (string | null)[] = []
    render(
      <Profiler id="bar" onRender={() => drawn.push(screen.getByLabelText('Position').textContent)}>
        <TransportBar />
      </Profiler>,
      { wrapper: fixture.wrapper },
    )
    act(() => transport.seek(30))
    drawn.length = 0
    act(() => transport.start())
    expect(new Set(drawn)).toEqual(new Set(['0:30.0']))

    act(() => transport.pause())
    act(() => transport.seek(5))
    drawn.length = 0
    act(() => transport.start())
    expect(new Set(drawn)).toEqual(new Set(['0:05.0']))
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

  it('gives a timeline with no end no loop length, where it read 0:00.0', () => {
    // A new engine's: the loop is off and its length is Infinity.
    const fixture = createTestEngine()
    render(<TransportBar />, { wrapper: fixture.wrapper })
    const loop = screen.getByRole('button', { name: 'Loop' })
    expect(loop).not.toHaveTextContent('0:00.0')
    expect(loop).toHaveAttribute('title', 'Loop')
    act(() => fixture.engine.transport.setLoop({ lengthSec: 8 }))
    expect(loop).toHaveTextContent('0:08.0')
    expect(loop).toHaveAttribute('title', 'Loop 0:08.0')
  })

  it('counts the passes of the loop, not the starts and seeks', () => {
    const fixture = createTestEngine()
    const { transport } = fixture.engine
    render(<TransportBar />, { wrapper: fixture.wrapper })
    act(() => transport.setLoop({ enabled: true, lengthSec: 8 }))
    act(() => transport.start())
    act(() => transport.pause())
    act(() => transport.start())
    act(() => transport.seek(1))
    // Started twice and moved once, and still the first time through the loop.
    expect(screen.queryByTitle('Loop pass')).toBeNull()

    // Twice round from 1 s in: the third pass.
    fixture.ctx.currentTime = 17
    act(() => fixture.frames.flush(1000))
    expect(screen.getByTitle('Loop pass')).toHaveTextContent('×3')
    act(() => transport.pause())
    act(() => transport.start())
    expect(screen.getByTitle('Loop pass')).toHaveTextContent('×3')

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(screen.queryByTitle('Loop pass')).toBeNull()
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
