import { describe, expect, it, vi } from 'vitest'

import { asAudioContext, createMockContext, type MockAudioContext } from '../../../testing'
import { silentReading, type MeterReading } from '../loudness'
import { type MeterHostMessage, type MeterProcessorOptions } from '../meter-protocol'
import { LufsMeter, defaultMeterProcessorUrl, type MeterNodeFactory } from '../LufsMeter'

const mockNodeFactory: MeterNodeFactory = (context, name, options) =>
  (context as unknown as MockAudioContext).createWorkletNode(
    name,
    options,
  ) as unknown as AudioWorkletNode

function reading(overrides: Partial<MeterReading>): MeterReading {
  return { ...silentReading(), ...overrides }
}

async function create(ctx: MockAudioContext, intervalMs?: number) {
  const meter = await LufsMeter.create(asAudioContext(ctx), {
    processorUrl: 'https://example.test/worklets/meter.js',
    createNode: mockNodeFactory,
    intervalMs,
  })
  const node = ctx.workletNodes[ctx.workletNodes.length - 1]
  return { meter, node }
}

describe('LufsMeter', () => {
  it('loads the processor once per context and builds a stereo sink node', async () => {
    const ctx = createMockContext()
    const { meter, node } = await create(ctx)
    await create(ctx)
    expect(ctx.audioWorklet.modules).toEqual(['https://example.test/worklets/meter.js'])
    expect(ctx.workletNodes).toHaveLength(2)
    expect(node.name).toBe('live-mix-meter')
    const options = node.options as AudioWorkletNodeOptions
    expect(options.numberOfInputs).toBe(1)
    expect(options.numberOfOutputs).toBe(0)
    expect(options.channelCount).toBe(2)
    expect(options.channelCountMode).toBe('explicit')
    expect((options.processorOptions as MeterProcessorOptions).intervalMs).toBe(50)
    expect(meter.input).toBe(node)
    expect(meter.intervalMs).toBe(50)
  })

  it('clamps the cadence to 33..1000 ms at creation and on setInterval', async () => {
    const ctx = createMockContext()
    const { meter, node } = await create(ctx, 1)
    expect(meter.intervalMs).toBeCloseTo(1000 / 30, 6)
    meter.setInterval(5000)
    expect(meter.intervalMs).toBe(1000)
    expect(node.port.posted.last?.[0]).toEqual({ type: 'set-interval', intervalMs: 1000 })
  })

  it('starts silent and exposes the latest reading through the getters', async () => {
    const ctx = createMockContext()
    const { meter, node } = await create(ctx)
    expect(meter.lufsMomentary).toBe(-Infinity)
    expect(meter.peak).toBe(0)
    expect(meter.peakDb).toBe(-Infinity)

    const message: MeterHostMessage = {
      type: 'reading',
      reading: reading({
        momentary: -20,
        shortTerm: -22,
        integrated: -23,
        samplePeak: [0.5, 0.25],
        truePeak: [0.55, 0.3],
        maxTruePeak: 0.9,
        elapsedSec: 3,
      }),
    }
    node.port.receive(message)
    expect(meter.reading).toBe(message.reading)
    expect(meter.lufsMomentary).toBe(-20)
    expect(meter.lufsShortTerm).toBe(-22)
    expect(meter.lufsIntegrated).toBe(-23)
    expect(meter.peak).toBe(0.5)
    expect(meter.peakDb).toBeCloseTo(-6.02, 2)
    expect(meter.truePeak).toBe(0.55)
    expect(meter.truePeakDb).toBeCloseTo(-5.19, 2)
    expect(meter.maxTruePeakDb).toBeCloseTo(-0.92, 2)
  })

  it('notifies subscribers per reading until they unsubscribe', async () => {
    const ctx = createMockContext()
    const { meter, node } = await create(ctx)
    const listener = vi.fn()
    const unsubscribe = meter.subscribe(listener)
    const first = reading({ momentary: -10 })
    node.port.receive({ type: 'reading', reading: first } satisfies MeterHostMessage)
    expect(listener).toHaveBeenCalledWith(first)
    unsubscribe()
    node.port.receive({ type: 'reading', reading: reading({ momentary: -9 }) })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('reset posts to the worklet and forgets the last reading', async () => {
    const ctx = createMockContext()
    const { meter, node } = await create(ctx)
    node.port.receive({ type: 'reading', reading: reading({ integrated: -14 }) })
    meter.reset()
    expect(meter.lufsIntegrated).toBe(-Infinity)
    expect(node.port.posted.last?.[0]).toEqual({ type: 'reset' })
  })

  it('dispose tells the processor to stop, disconnects, and ignores later traffic', async () => {
    const ctx = createMockContext()
    const { meter, node } = await create(ctx)
    const listener = vi.fn()
    meter.subscribe(listener)
    meter.dispose()
    meter.dispose()
    expect(node.port.posted.calls.map((call) => call[0])).toEqual([{ type: 'dispose' }])
    expect(node.disconnectCalls.count).toBe(1)
    node.port.receive({ type: 'reading', reading: reading({ momentary: -1 }) })
    expect(listener).not.toHaveBeenCalled()
    expect(meter.lufsMomentary).toBe(-Infinity)
    meter.reset()
    expect(node.port.posted.count).toBe(1)
  })

  it('resolves the bundled processor next to the core entry by default', () => {
    expect(defaultMeterProcessorUrl().endsWith('/worklets/meter.js')).toBe(true)
  })
})
