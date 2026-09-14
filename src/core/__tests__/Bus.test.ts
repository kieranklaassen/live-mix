import { describe, expect, it } from 'vitest'

import { type Device } from '../devices/Device'
import { asAudioContext, createMockContext, type MockAudioContext } from '../../testing'
import { Bus } from '../buses/Bus'
import { MasterBus } from '../buses/MasterBus'
import { OutputRouter } from '../output/OutputRouter'

/** A device made of one gain node, enough to test insert wiring. */
function fakeDevice(ctx: MockAudioContext, id: string): Device {
  const node = ctx.createGain()
  return {
    id,
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

describe('Bus', () => {
  it('is exactly one gain node connected to its destination', () => {
    const ctx = createMockContext()
    const bus = new Bus(asAudioContext(ctx), {
      name: 'music',
      destination: ctx.destination as unknown as AudioNode,
    })
    expect(ctx.gains).toHaveLength(1)
    expect(bus.input).toBe(ctx.gains[0])
    expect(bus.output).toBe(ctx.gains[0])
    expect(bus.gain).toBe(ctx.gains[0].gain)
    expect(ctx.gains[0].isConnectedTo(ctx.destination)).toBe(true)
  })

  it('setLevel ramps with setTargetAtTime at now with the default 5 ms constant', () => {
    const ctx = createMockContext({ currentTime: 3 })
    const bus = new Bus(asAudioContext(ctx), {
      name: 'b',
      destination: ctx.destination as unknown as AudioNode,
    })
    bus.setLevel(0.4)
    bus.setLevel(-1, { at: 4, timeConstant: 0.05 })
    expect(ctx.gains[0].gain.eventsFor('setTargetAtTime').map((e) => e.args)).toEqual([
      [0.4, 3, 0.005],
      [0, 4, 0.05],
    ])
  })

  it('adds inserts post-fader and rewires the chain on add and remove', () => {
    const ctx = createMockContext()
    const dest = ctx.destination
    const bus = new Bus(asAudioContext(ctx), {
      name: 'b',
      destination: dest as unknown as AudioNode,
    })
    const fader = ctx.gains[0]
    const a = fakeDevice(ctx, 'a')
    const b = fakeDevice(ctx, 'b')

    bus.addInsert(a)
    expect(fader.isConnectedTo(dest)).toBe(false)
    expect(fader.isConnectedTo(a.input as never)).toBe(true)
    expect((a.output as never as typeof fader).isConnectedTo(dest)).toBe(true)
    expect(bus.output).toBe(a.output)

    bus.addInsert(b)
    bus.addInsert(b)
    expect(bus.inserts).toEqual([a, b])
    expect((a.output as never as typeof fader).isConnectedTo(dest)).toBe(false)
    expect((a.output as never as typeof fader).isConnectedTo(b.input as never)).toBe(true)
    expect((b.output as never as typeof fader).isConnectedTo(dest)).toBe(true)
    expect(fader.reaches(dest)).toBe(true)

    bus.removeInsert(a)
    expect(bus.inserts).toEqual([b])
    expect(fader.isConnectedTo(b.input as never)).toBe(true)
    expect(fader.reaches(dest)).toBe(true)

    bus.removeInsert(b)
    expect(bus.inserts).toEqual([])
    expect(fader.isConnectedTo(dest)).toBe(true)
  })

  it('connectTo re-points the chain tail', () => {
    const ctx = createMockContext()
    const bus = new Bus(asAudioContext(ctx), {
      name: 'b',
      destination: ctx.destination as unknown as AudioNode,
    })
    const other = ctx.createGain()
    bus.connectTo(other as unknown as AudioNode)
    expect(ctx.gains[0].isConnectedTo(ctx.destination)).toBe(false)
    expect(ctx.gains[0].isConnectedTo(other)).toBe(true)
  })

  it('dispose disconnects and refuses further edits', () => {
    const ctx = createMockContext()
    const bus = new Bus(asAudioContext(ctx), {
      name: 'b',
      destination: ctx.destination as unknown as AudioNode,
    })
    bus.dispose()
    bus.dispose()
    expect(ctx.gains[0].disconnectCalls.count).toBe(1)
    expect(() => bus.addInsert(fakeDevice(ctx, 'x'))).toThrow(/disposed/)
  })
})

describe('MasterBus', () => {
  it('feeds the router output and is the first gain created', () => {
    const ctx = createMockContext()
    const router = new OutputRouter(asAudioContext(ctx))
    const master = new MasterBus(asAudioContext(ctx), router)
    expect(ctx.gains[0]).toBe(master.gainNode)
    expect(ctx.gains[0].isConnectedTo(ctx.destination)).toBe(true)
    expect(master.meter).toBeNull()
    expect(master.level()).toBe(0)
    expect(ctx.analysers).toHaveLength(0)
  })

  it('with meter: gain → analyser(2048) → output, inserts stay before the meter', () => {
    const ctx = createMockContext()
    const router = new OutputRouter(asAudioContext(ctx))
    const master = new MasterBus(asAudioContext(ctx), router, { meter: true, gain: 0.8 })
    const analyser = ctx.analysers[0]
    const fader = ctx.gains[0]
    expect(analyser.fftSize).toBe(2048)
    expect(fader.gain.value).toBe(0.8)
    expect(fader.isConnectedTo(analyser)).toBe(true)
    expect(analyser.isConnectedTo(ctx.destination)).toBe(true)

    analyser.level = 0.25
    expect(master.level()).toBeCloseTo(0.25)

    const device = fakeDevice(ctx, 'plate')
    master.addInsert(device)
    expect(fader.isConnectedTo(device.input as never)).toBe(true)
    expect((device.output as never as typeof analyser).isConnectedTo(analyser)).toBe(true)
    expect(fader.reaches(ctx.destination)).toBe(true)
  })
})

describe('Bus level tracking (U24 hooks follow-up)', () => {
  it('stores the fader target and reports level and insert changes', () => {
    const ctx = createMockContext()
    const bus = new Bus(asAudioContext(ctx), {
      name: 'music',
      destination: ctx.createGain() as unknown as AudioNode,
      gain: 0.5,
    })
    expect(bus.targetLevel).toBe(0.5)
    const seen: string[] = []
    const unsubscribe = bus.onChange((change) => {
      expect(change.bus).toBe(bus)
      seen.push(change.kind)
    })
    bus.setLevel(0.8)
    expect(bus.targetLevel).toBe(0.8)
    bus.setLevel(-1)
    expect(bus.targetLevel).toBe(0)
    expect(ctx.gains[1].gain.lastEvent('setTargetAtTime')?.args[0]).toBe(0)
    expect(seen).toEqual(['level', 'level'])
    unsubscribe()
    bus.setLevel(1)
    expect(seen).toEqual(['level', 'level'])
    expect(
      new Bus(asAudioContext(ctx), {
        name: 'x',
        destination: ctx.createGain() as unknown as AudioNode,
      }).targetLevel,
    ).toBe(1)
  })
})
