import { describe, expect, it, vi } from 'vitest'

import { asAudioContext, createMockContext } from '../../testing'
import { createEngine } from '../Engine'
import * as core from '../../index'

describe('createEngine', () => {
  it('builds router → master in the consumer-visible node order (direct mode)', () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    expect(ctx.gains).toHaveLength(1)
    expect(engine.master.gainNode).toBe(ctx.gains[0])
    expect(ctx.gains[0].isConnectedTo(ctx.destination)).toBe(true)
    expect(engine.output.output).toBe(ctx.destination)
  })

  it('element mode creates the stream destination before the master gain', () => {
    const ctx = createMockContext()
    const element = { autoplay: false, muted: true, srcObject: null, play: vi.fn(), pause: vi.fn() }
    const engine = createEngine({
      context: asAudioContext(ctx),
      output: {
        mode: 'element',
        createAudioElement: () => element as unknown as HTMLAudioElement,
        mediaSession: null,
      },
    })
    expect(ctx.streamDestinations).toHaveLength(1)
    expect(ctx.gains[0].isConnectedTo(ctx.streamDestinations[0])).toBe(true)
    expect(ctx.gains[0].isConnectedTo(ctx.destination)).toBe(false)
    expect(element.srcObject).toBe(ctx.streamDestinations[0].stream)
    engine.activateOutput()
    expect(element.play).toHaveBeenCalledTimes(1)
  })

  it('named buses feed the master by default, in creation order', () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    const music = engine.addBus('music')
    const aux = engine.addBus('aux', { destination: music, gain: 0.5 })
    expect(ctx.gains).toHaveLength(3)
    expect(music.gainNode).toBe(ctx.gains[1])
    expect(ctx.gains[1].isConnectedTo(ctx.gains[0])).toBe(true)
    expect(ctx.gains[2].isConnectedTo(ctx.gains[1])).toBe(true)
    expect(ctx.gains[2].gain.value).toBe(0.5)
    expect(engine.bus('music')).toBe(music)
    expect(engine.hasBus('aux')).toBe(true)
    expect(engine.buses).toEqual([music, aux])
    expect(() => engine.addBus('music')).toThrow(/already exists/)
    expect(() => engine.bus('nope')).toThrow(/no bus/)

    engine.removeBus('aux')
    expect(engine.hasBus('aux')).toBe(false)
    expect(ctx.gains[2].disconnectCalls.count).toBe(1)
  })

  it('uses the injected clock and timers', () => {
    const ctx = createMockContext({ currentTime: 12 })
    const setIntervalFn = vi.fn(() => 1 as unknown as ReturnType<typeof setInterval>)
    const clearIntervalFn = vi.fn()
    const engine = createEngine({
      context: asAudioContext(ctx),
      now: () => 99,
      setIntervalFn,
      clearIntervalFn,
    })
    expect(engine.now()).toBe(99)
    expect(engine.clock.setIntervalFn).toBe(setIntervalFn)
    expect(engine.clock.clearIntervalFn).toBe(clearIntervalFn)

    const defaulted = createEngine({ context: asAudioContext(ctx) })
    expect(defaulted.now()).toBe(12)
  })

  it('dispose disconnects buses, master and router and blocks further use', () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx), master: { meter: true } })
    engine.addBus('music')
    engine.dispose()
    engine.dispose()
    expect(ctx.gains[0].disconnectCalls.count).toBeGreaterThanOrEqual(1)
    expect(ctx.gains[1].disconnectCalls.count).toBe(1)
    expect(ctx.analysers[0].disconnectCalls.count).toBe(1)
    expect(() => engine.addBus('x')).toThrow(/disposed/)
  })

  it('the core entry is import-safe without a window (SSR)', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof core.createEngine).toBe('function')
    expect(typeof core.OutputRouter).toBe('function')
    expect(typeof core.Meter).toBe('function')
    expect(core.isIOSWebKit()).toBe(false)
  })
})
