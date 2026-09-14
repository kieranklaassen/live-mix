import { describe, expect, it, vi } from 'vitest'

import { type Device } from '../devices/Device'
import {
  asAudioContext,
  createMockContext,
  type MockAudioContext,
  type MockGainNode,
} from '../../testing'
import { type MeterNodeFactory } from '../analysis/LufsMeter'
import { MasterBus } from '../buses/MasterBus'
import { OutputRouter } from '../output/OutputRouter'
import { type ParamSpec } from '../params'
import { createEngine } from '../Engine'

const LIMITER_PARAMS = {
  ceilingDb: {
    id: 0,
    name: 'Ceiling',
    min: -20,
    max: 0,
    default: -1,
    taper: 'linear',
    unit: 'dBTP',
  },
} as const satisfies Record<string, ParamSpec>

/** A limiter stand-in: one gain node with a recording param table and bypass. */
function fakeLimiter(ctx: MockAudioContext) {
  const node = ctx.createGain()
  const values = new Map<string, number>([['ceilingDb', -1]])
  const device = {
    id: 'fake-limiter',
    input: node as unknown as AudioNode,
    output: node as unknown as AudioNode,
    params: LIMITER_PARAMS,
    setParam: vi.fn((name: string, value: number) => values.set(name, value)),
    getParam: (name: string) => values.get(name) ?? 0,
    bypass: true,
    latencySec: 0.0016,
    dispose: vi.fn(() => node.disconnect()),
  } satisfies Device
  return { device, node }
}

function fakeInsert(ctx: MockAudioContext, id: string): Device & { node: MockGainNode } {
  const node = ctx.createGain()
  return {
    id,
    node,
    input: node as unknown as AudioNode,
    output: node as unknown as AudioNode,
    params: {},
    setParam: () => {},
    getParam: () => 0,
    bypass: false,
    latencySec: 0,
    dispose: () => node.disconnect(),
  }
}

const mockNodeFactory: MeterNodeFactory = (context, name, options) =>
  (context as unknown as MockAudioContext).createWorkletNode(
    name,
    options,
  ) as unknown as AudioWorkletNode

function master(options: { meter?: boolean } = {}) {
  const ctx = createMockContext()
  const router = new OutputRouter(asAudioContext(ctx))
  const bus = new MasterBus(asAudioContext(ctx), router, options)
  return { ctx, router, bus, fader: ctx.gains[0] }
}

describe('MasterBus.installLimiter', () => {
  it('creates nothing by default', () => {
    const { ctx, bus } = master()
    expect(bus.limiter).toBeNull()
    expect(bus.lufs).toBeNull()
    expect(ctx.gains).toHaveLength(1)
    expect(ctx.workletNodes).toHaveLength(0)
  })

  it('places the limiter after the fader and inserts, before the terminus, and forces bypass off', async () => {
    const { ctx, bus, fader } = master()
    const insert = fakeInsert(ctx, 'plate')
    bus.addInsert(insert)
    const { device, node } = fakeLimiter(ctx)
    const limiter = await bus.installLimiter(() => device)

    expect(bus.limiter).toBe(limiter)
    expect(limiter.id).toBe('fake-limiter')
    expect(limiter.latencySec).toBe(0.0016)
    expect(limiter.params).toBe(LIMITER_PARAMS)
    expect(device.bypass).toBe(false)
    expect('bypass' in limiter).toBe(false)

    expect(fader.isConnectedTo(insert.node)).toBe(true)
    expect(insert.node.isConnectedTo(node)).toBe(true)
    expect(insert.node.isConnectedTo(ctx.destination)).toBe(false)
    expect(node.isConnectedTo(ctx.destination)).toBe(true)
    expect(bus.inserts).toEqual([insert])
  })

  it('keeps later inserts ahead of the limiter and removeInsert cannot touch it', async () => {
    const { ctx, bus, fader } = master()
    const { device, node } = fakeLimiter(ctx)
    await bus.installLimiter(() => Promise.resolve(device))
    expect(fader.isConnectedTo(node)).toBe(true)

    const insert = fakeInsert(ctx, 'widener')
    bus.addInsert(insert)
    expect(fader.isConnectedTo(insert.node)).toBe(true)
    expect(insert.node.isConnectedTo(node)).toBe(true)
    expect(node.isConnectedTo(ctx.destination)).toBe(true)

    bus.removeInsert(insert)
    expect(fader.isConnectedTo(node)).toBe(true)
    bus.removeInsert(device)
    expect(fader.isConnectedTo(node)).toBe(true)
    expect(node.isConnectedTo(ctx.destination)).toBe(true)
  })

  it('sits before the analyser meter so the peak meter reads the limited output', async () => {
    const { ctx, bus, fader } = master({ meter: true })
    const analyser = ctx.analysers[0]
    const { device, node } = fakeLimiter(ctx)
    await bus.installLimiter(() => device)
    expect(fader.isConnectedTo(node)).toBe(true)
    expect(node.isConnectedTo(analyser)).toBe(true)
    expect(analyser.isConnectedTo(ctx.destination)).toBe(true)
    expect(fader.reaches(ctx.destination)).toBe(true)
  })

  it('forwards typed parameter access to the device', async () => {
    const { ctx, bus } = master()
    const { device } = fakeLimiter(ctx)
    const limiter = await bus.installLimiter(() => device)
    limiter.setParam('ceilingDb', -3)
    expect(device.setParam).toHaveBeenCalledWith('ceilingDb', -3)
    expect(limiter.getParam('ceilingDb')).toBe(-3)
  })

  it('moves existing taps behind the limiter and feeds new ones from it', async () => {
    const { ctx, bus, fader } = master()
    const early = ctx.createAnalyser()
    bus.addTap(early as unknown as AudioNode)
    expect(fader.isConnectedTo(early)).toBe(true)

    const { device, node } = fakeLimiter(ctx)
    await bus.installLimiter(() => device)
    expect(fader.isConnectedTo(early)).toBe(false)
    expect(node.isConnectedTo(early)).toBe(true)

    const late = ctx.createAnalyser()
    bus.addTap(late as unknown as AudioNode)
    expect(node.isConnectedTo(late)).toBe(true)

    // Insert changes rewire the chain tail, not the limiter output.
    const insert = fakeInsert(ctx, 'x')
    bus.addInsert(insert)
    expect(node.isConnectedTo(early)).toBe(true)
    expect(insert.node.isConnectedTo(early)).toBe(false)
    expect(node.connectCalls.count).toBe(3)
  })

  it('is installed once and disposed with the bus', async () => {
    const { ctx, bus } = master()
    const first = fakeLimiter(ctx)
    await bus.installLimiter(() => first.device)
    const second = fakeLimiter(ctx)
    await expect(bus.installLimiter(() => second.device)).rejects.toThrow(/already has a limiter/)
    expect(second.device.dispose).not.toHaveBeenCalled()

    bus.dispose()
    expect(first.device.dispose).toHaveBeenCalledTimes(1)
    expect(bus.limiter).toBeNull()
    await expect(bus.installLimiter(() => second.device)).rejects.toThrow(/disposed/)
  })

  it('disposes a device whose factory lost the race', async () => {
    const { ctx, bus } = master()
    const a = fakeLimiter(ctx)
    const b = fakeLimiter(ctx)
    const [won, lost] = await Promise.allSettled([
      bus.installLimiter(() => Promise.resolve(a.device)),
      bus.installLimiter(() => Promise.resolve(b.device)),
    ])
    expect(won.status).toBe('fulfilled')
    expect(lost.status).toBe('rejected')
    expect(b.device.dispose).toHaveBeenCalledTimes(1)
    expect(bus.limiter?.id).toBe('fake-limiter')
  })
})

describe('MasterBus.installLufsMeter', () => {
  it('creates the meter worklet as a tap on the master output', async () => {
    const { ctx, bus, fader } = master()
    const meter = await bus.installLufsMeter({ processorUrl: 'p', createNode: mockNodeFactory })
    expect(bus.lufs).toBe(meter)
    expect(ctx.workletNodes).toHaveLength(1)
    expect(fader.isConnectedTo(ctx.workletNodes[0])).toBe(true)
    expect(fader.isConnectedTo(ctx.destination)).toBe(true)
    expect(bus.taps).toEqual([ctx.workletNodes[0]])
    expect(meter.lufsShortTerm).toBe(-Infinity)
  })

  it('taps the limited signal when a limiter is installed, in either order', async () => {
    const { ctx, bus, fader } = master()
    await bus.installLufsMeter({ processorUrl: 'p', createNode: mockNodeFactory })
    const { device, node } = fakeLimiter(ctx)
    await bus.installLimiter(() => device)
    expect(fader.isConnectedTo(ctx.workletNodes[0])).toBe(false)
    expect(node.isConnectedTo(ctx.workletNodes[0])).toBe(true)

    const other = master()
    const limiter = fakeLimiter(other.ctx)
    await other.bus.installLimiter(() => limiter.device)
    await other.bus.installLufsMeter({ processorUrl: 'p', createNode: mockNodeFactory })
    expect(limiter.node.isConnectedTo(other.ctx.workletNodes[0])).toBe(true)
    expect(other.fader.isConnectedTo(other.ctx.workletNodes[0])).toBe(false)
  })

  it('is installed once and disposed with the bus', async () => {
    const { ctx, bus } = master()
    await bus.installLufsMeter({ processorUrl: 'p', createNode: mockNodeFactory })
    await expect(
      bus.installLufsMeter({ processorUrl: 'p', createNode: mockNodeFactory }),
    ).rejects.toThrow(/already has a LUFS meter/)
    bus.dispose()
    expect(ctx.workletNodes[0].port.posted.last?.[0]).toEqual({ type: 'dispose' })
    expect(bus.lufs).toBeNull()
  })
})

describe('Engine master stages', () => {
  it('adds no nodes to the default graph and exposes stats', () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx), master: { meter: true } })
    expect(ctx.gains).toHaveLength(1)
    expect(ctx.analysers).toHaveLength(1)
    expect(ctx.workletNodes).toHaveLength(0)
    expect(engine.master.limiter).toBeNull()
    expect(engine.master.lufs).toBeNull()
    expect(engine.stats.supported).toBe(false)
    expect(engine.stats.glitches).toBe(0)
    engine.dispose()
  })

  it('wires limiter and meter through engine.master', async () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    const { device, node } = fakeLimiter(ctx)
    const limiter = await engine.master.installLimiter(() => device)
    const meter = await engine.master.installLufsMeter({
      processorUrl: 'p',
      createNode: mockNodeFactory,
    })
    expect(engine.master.limiter).toBe(limiter)
    expect(engine.master.lufs).toBe(meter)
    expect(ctx.gains[0].isConnectedTo(node)).toBe(true)
    expect(node.isConnectedTo(ctx.destination)).toBe(true)
    expect(node.isConnectedTo(ctx.workletNodes[0])).toBe(true)
    engine.dispose()
    expect(device.dispose).toHaveBeenCalledTimes(1)
  })
})
