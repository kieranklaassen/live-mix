import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  MockAudioContext,
  MockGainNode,
  advance,
  asAudioContext,
  configureMocks,
  createMockContext,
} from '../index'

afterEach(() => {
  configureMocks({})
  vi.useRealTimers()
})

describe('MockAudioParam recorder', () => {
  it('records AudioParam automation calls in order with their arguments', () => {
    const ctx = createMockContext()
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, 1)
    gain.gain.setValueCurveAtTime(new Float32Array([0, 1]), 1, 2.5)
    gain.gain.setTargetAtTime(0.5, 3, 0.08)
    gain.gain.linearRampToValueAtTime(1, 4)
    gain.gain.cancelScheduledValues(5)

    expect(gain.gain.events.map((e) => e.method)).toEqual([
      'setValueAtTime',
      'setValueCurveAtTime',
      'setTargetAtTime',
      'linearRampToValueAtTime',
      'cancelScheduledValues',
    ])
    expect(gain.gain.eventsFor('setValueCurveAtTime')[0].args[2]).toBe(2.5)
    expect(gain.gain.lastEvent('setTargetAtTime')?.args).toEqual([0.5, 3, 0.08])
  })
})

describe('MockAudioContext', () => {
  it('lists nodes per kind in creation order', () => {
    const ctx = createMockContext()
    const master = ctx.createGain()
    const duck = ctx.createGain()
    const analyser = ctx.createAnalyser()
    const convolver = ctx.createConvolver()
    const streamDestination = ctx.createMediaStreamDestination()
    const compressor = ctx.createDynamicsCompressor()
    const panner = ctx.createStereoPanner()
    const filter = ctx.createBiquadFilter()

    expect(ctx.gains).toEqual([master, duck])
    expect(ctx.analysers).toEqual([analyser])
    expect(ctx.convolvers).toEqual([convolver])
    expect(ctx.streamDestinations).toEqual([streamDestination])
    expect(ctx.compressors).toEqual([compressor])
    expect(ctx.panners).toEqual([panner])
    expect(ctx.filters).toEqual([filter])
    expect(ctx.allNodes().map((n) => n.kind)).toEqual([
      'gain',
      'gain',
      'analyser',
      'convolver',
      'media-stream-destination',
      'dynamics-compressor',
      'stereo-panner',
      'biquad',
    ])
  })

  it('records connections and answers reachability', () => {
    const ctx = createMockContext()
    const a = ctx.createGain()
    const b = ctx.createGain()
    a.connect(b)
    b.connect(ctx.destination)

    expect(a.connectCalls.calledWith(b)).toBe(true)
    expect(a.isConnectedTo(ctx.destination)).toBe(false)
    expect(a.reaches(ctx.destination)).toBe(true)

    b.disconnect()
    expect(a.reaches(ctx.destination)).toBe(false)
    expect(b.disconnectCalls.count).toBe(1)
  })

  it('decodes to a buffer whose duration equals the byte length by default', async () => {
    const ctx = createMockContext()
    const buffer = await ctx.decodeAudioData(new ArrayBuffer(8))
    expect(buffer.duration).toBe(8)
    expect(buffer.numberOfChannels).toBe(2)
    expect(buffer.getChannelData(0)).toHaveLength(8 * ctx.sampleRate)
    expect(ctx.decodeCalls.count).toBe(1)
  })

  it('accepts a custom decoder and sample rate', async () => {
    const ctx = createMockContext({
      sampleRate: 48000,
      decode: (_data, c) => c.createBuffer(1, 480, c.sampleRate),
    })
    const buffer = await ctx.decodeAudioData(new ArrayBuffer(1))
    expect(buffer.duration).toBeCloseTo(0.01)
    expect(ctx.sampleRate).toBe(48000)
  })

  it('records buffer source start/stop calls and fires onended via finish()', () => {
    const ctx = createMockContext()
    const source = ctx.createBufferSource()
    let ended = 0
    source.onended = () => {
      ended += 1
    }
    source.start(1.5, 0.25, 4)
    source.stop(5.5)
    source.finish()
    expect(source.startCalls.calledWith(1.5)).toBe(true)
    expect(source.startCalls.last).toEqual([1.5, 0.25, 4])
    expect(source.stopCalls.last).toEqual([5.5])
    expect(ended).toBe(1)
  })

  it('records worklet module loads and port messages', async () => {
    const ctx = createMockContext()
    await ctx.audioWorklet.addModule('blob:worklet')
    const node = ctx.createWorkletNode('live-mix-wasm-device', { processorOptions: { a: 1 } })
    node.port.postMessage({ type: 'set-param', paramId: 0, value: 0.5 })
    let received: unknown = null
    node.port.onmessage = (event) => {
      received = event.data
    }
    node.port.receive({ type: 'ready' })

    expect(ctx.audioWorklet.modules).toEqual(['blob:worklet'])
    expect(ctx.workletNodes).toEqual([node])
    expect(node.port.posted.last?.[0]).toEqual({ type: 'set-param', paramId: 0, value: 0.5 })
    expect(received).toEqual({ type: 'ready' })
  })

  it('casts to the DOM types without complaint', () => {
    const ctx = createMockContext()
    const real: AudioContext = asAudioContext(ctx)
    expect(real.currentTime).toBe(0)
    expect(ctx).toBeInstanceOf(MockAudioContext)
  })
})

describe('runner integration (configureMocks)', () => {
  it('makes recorded methods runner spies so toHaveBeenCalledWith works', () => {
    configureMocks({ spy: vi.fn })
    const ctx = createMockContext()
    const voice = new MockGainNode()
    const analyser = ctx.createAnalyser()
    const source = ctx.createBufferSource()

    voice.connect(analyser)
    source.start(0)
    source.stop(10)
    voice.disconnect()

    expect(voice.connect).toHaveBeenCalledWith(analyser)
    expect(voice.disconnect).toHaveBeenCalled()
    expect(source.start).toHaveBeenCalledWith(0)
    expect(source.stop).toHaveBeenCalledWith(10)
    expect(source.start).toHaveBeenCalledTimes(1)
    expect(voice.connectCalls.calledWith(analyser)).toBe(true)
  })

  it('advance() moves the clock and drives fake timers together', async () => {
    vi.useFakeTimers()
    configureMocks({ advanceTimers: vi.advanceTimersByTimeAsync })
    const ctx = createMockContext()
    const seen: number[] = []
    const timer = setInterval(() => seen.push(ctx.currentTime), 100)

    await advance(ctx, 0.5)
    clearInterval(timer)

    expect(ctx.currentTime).toBeCloseTo(0.5)
    expect(seen).toHaveLength(5)
    expect(seen[0]).toBeCloseTo(0.1)
    expect(seen[4]).toBeCloseTo(0.5)
  })

  it('advance() without a timer advancer only moves the clock', async () => {
    const ctx = createMockContext()
    await advance(ctx, 1, 250)
    expect(ctx.currentTime).toBeCloseTo(1)
  })
})
