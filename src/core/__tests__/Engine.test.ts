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
    void engine.activateOutput()
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

describe('Engine transport and scheduler', () => {
  it('owns one transport on the engine clock and a scheduler on the engine timers', () => {
    const ctx = createMockContext({ currentTime: 5 })
    const ticks: (() => void)[] = []
    const setIntervalFn = vi.fn((cb: () => void) => {
      ticks.push(cb)
      return ticks.length as unknown as ReturnType<typeof setInterval>
    })
    const clearIntervalFn = vi.fn()
    const engine = createEngine({
      context: asAudioContext(ctx),
      setIntervalFn,
      clearIntervalFn,
      tickMs: 100,
      loop: { enabled: true, lengthSec: 32 },
    })
    expect(engine.transport.state).toBe('stopped')
    expect(engine.transport.loop).toEqual({ enabled: true, lengthSec: 32 })
    expect(engine.scheduler.tickMs).toBe(100)

    engine.transport.start()
    expect(engine.transport.position().positionSec).toBe(0)
    expect(setIntervalFn).toHaveBeenCalledWith(expect.any(Function), 100)
    ctx.currentTime = 7
    expect(engine.transport.position().positionSec).toBe(2)

    engine.transport.stop({ fadeSec: 0.75 })
    expect(clearIntervalFn).toHaveBeenCalled()
    engine.dispose()
  })
})

describe('Engine instrument tracks', () => {
  it('hosts a NoteDevice, passes notes through and connects its output to the master', () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    const node = ctx.createGain()
    const notes: string[] = []
    const device = {
      id: 'synth',
      input: node as unknown as AudioNode,
      output: node as unknown as AudioNode,
      params: {},
      setParam: () => {},
      getParam: () => 0,
      bypass: false,
      latencySec: 0,
      dispose: vi.fn(),
      noteOn: (id: number, hz: number, gain?: number) => notes.push(`on:${id}:${hz}:${gain}`),
      noteOff: (id: number) => notes.push(`off:${id}`),
    }
    const synth = engine.addInstrumentTrack('synth', { device })
    expect(node.connectCalls.calledWith(ctx.gains[0])).toBe(true)
    synth.noteOn(60, 440, 0.4)
    synth.noteOff(60)
    expect(notes).toEqual(['on:60:440:0.4', 'off:60'])
    expect(engine.instrument('synth')).toBe(synth)
    expect(() => engine.addInstrumentTrack('synth', { device })).toThrow(/already exists/)
    engine.dispose()
    expect(device.dispose).toHaveBeenCalledTimes(1)
    synth.noteOn(61, 466)
    expect(notes).toHaveLength(2)
  })
})

describe('engine change events and latency (U24 hooks follow-up)', () => {
  it('reports every add/remove of tracks, groups, returns, live inputs, instruments and buses, then dispose', async () => {
    const ctx = createMockContext({ baseLatency: 0.005, outputLatency: 0.02 })
    const engine = createEngine({ context: asAudioContext(ctx) })
    const seen: unknown[] = []
    const unsubscribe = engine.onChange((change) => seen.push(change))

    engine.addBus('music')
    engine.addAudioTrack('pad')
    engine.addGroup('stems')
    engine.addLiveInputTrack('mic')
    engine.addElementTrack('bed')
    engine.removeTrack('pad')
    engine.removeGroup('stems')
    engine.removeLiveInputTrack('mic')
    engine.removeElementTrack('bed')
    engine.removeBus('music')
    engine.removeBus('music') // no-op: nothing to report

    expect(seen).toEqual([
      { kind: 'bus', action: 'added', name: 'music' },
      { kind: 'track', action: 'added', name: 'pad' },
      { kind: 'group', action: 'added', name: 'stems' },
      { kind: 'live-input', action: 'added', name: 'mic' },
      { kind: 'element-track', action: 'added', name: 'bed' },
      { kind: 'track', action: 'removed', name: 'pad' },
      { kind: 'group', action: 'removed', name: 'stems' },
      { kind: 'live-input', action: 'removed', name: 'mic' },
      { kind: 'element-track', action: 'removed', name: 'bed' },
      { kind: 'bus', action: 'removed', name: 'music' },
    ])
    expect(engine.liveInputs).toEqual([])
    expect(engine.returnTracks).toEqual([])
    expect(engine.instruments).toEqual([])

    seen.length = 0
    engine.dispose()
    expect(seen).toEqual([{ kind: 'dispose' }])
    unsubscribe()
    await Promise.resolve()
  })

  it('unsubscribe stops delivery', () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    const seen: unknown[] = []
    const unsubscribe = engine.onChange((change) => seen.push(change))
    unsubscribe()
    engine.addBus('a')
    expect(seen).toEqual([])
    engine.dispose()
  })

  it('ioLatency() sums context base + output latency with the largest live-input latency', () => {
    const ctx = createMockContext({ baseLatency: 0.005, outputLatency: 0.02 })
    const engine = createEngine({ context: asAudioContext(ctx) })
    expect(engine.ioLatency()).toEqual({
      baseSec: 0.005,
      outputSec: 0.02,
      inputSec: 0,
      totalSec: 0.025,
    })

    const mic = engine.addLiveInputTrack('mic')
    const stream = {
      getAudioTracks: () => [{ getSettings: () => ({ latency: 0.012 }) }],
    } as unknown as MediaStream
    mic.attach(stream)
    expect(mic.inputLatencySec).toBe(0.012)
    const other = engine.addLiveInputTrack('line')
    other.attach(ctx.createGain() as unknown as AudioNode)
    expect(other.inputLatencySec).toBe(0)
    const latency = engine.ioLatency()
    expect(latency.inputSec).toBe(0.012)
    expect(latency.totalSec).toBeCloseTo(0.037)
    engine.dispose()
  })

  it('ioLatency() treats missing latency fields as zero', () => {
    const ctx = createMockContext()
    ;(ctx as { outputLatency?: number }).outputLatency = undefined
    const engine = createEngine({ context: asAudioContext(ctx) })
    expect(engine.ioLatency().totalSec).toBe(0)
    engine.dispose()
  })
})

describe('engine stretch tracks (U31 follow-up)', () => {
  it('adds, lists, removes and reports stretch tracks; names share the track namespace', () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    const seen: unknown[] = []
    engine.onChange((change) => seen.push(change))
    const createStretch = () => Promise.reject(new Error('unused'))
    const warped = engine.addStretchTrack('warped', { createStretch })
    expect(engine.stretchTracks).toEqual([warped])
    expect(engine.stretchTrack('warped')).toBe(warped)
    expect(warped.strip.destinationTarget).toBe(engine.master)
    expect(() => engine.addAudioTrack('warped')).toThrow(/already exists/)
    expect(() => engine.addStretchTrack('warped', { createStretch })).toThrow(/already exists/)
    engine.addAudioTrack('plain')
    expect(() => engine.addStretchTrack('plain', { createStretch })).toThrow(/already exists/)
    expect(engine.latencyReport().paths.map((path) => path.key)).toContain('track/warped')
    // Retained like audio tracks: a hold exists before the first node asks for its sample.
    expect(engine.retainerFor(warped)).toBeDefined()
    engine.removeStretchTrack('warped')
    expect(engine.retainerFor(warped)).toBeUndefined()
    expect(engine.stretchTracks).toEqual([])
    expect(() => engine.stretchTrack('warped')).toThrow(/no stretch track/)
    expect(seen).toEqual([
      { kind: 'stretch-track', action: 'added', name: 'warped' },
      { kind: 'track', action: 'added', name: 'plain' },
      { kind: 'stretch-track', action: 'removed', name: 'warped' },
    ])
    engine.dispose()
  })
})
