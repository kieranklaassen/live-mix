import { describe, expect, it } from 'vitest'

import { type Device } from '../devices/Device'
import { asAudioContext, createMockContext, type MockAudioContext } from '../../testing'
import { Bus } from '../buses/Bus'

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

function setup() {
  const ctx = createMockContext()
  const bus = new Bus(asAudioContext(ctx), {
    name: 'b',
    destination: ctx.destination as unknown as AudioNode,
  })
  const tap = ctx.createAnalyser()
  return { ctx, bus, tap, fader: ctx.gains[0] }
}

describe('Bus taps', () => {
  it('feeds the tap from the chain tail and lists it', () => {
    const { ctx, bus, tap, fader } = setup()
    bus.addTap(tap as unknown as AudioNode)
    bus.addTap(tap as unknown as AudioNode)
    expect(bus.taps).toEqual([tap])
    expect(fader.isConnectedTo(tap)).toBe(true)
    expect(fader.isConnectedTo(ctx.destination)).toBe(true)
    expect(fader.connectCalls.count).toBe(2)
  })

  it('follows the tail when inserts are added and removed', () => {
    const { ctx, bus, tap, fader } = setup()
    bus.addTap(tap as unknown as AudioNode)
    const a = fakeDevice(ctx, 'a')
    const b = fakeDevice(ctx, 'b')
    const nodeOf = (device: Device) => device.output as unknown as typeof fader

    bus.addInsert(a)
    expect(fader.isConnectedTo(tap)).toBe(false)
    expect(nodeOf(a).isConnectedTo(tap)).toBe(true)
    expect(nodeOf(a).isConnectedTo(ctx.destination)).toBe(true)

    bus.addInsert(b)
    expect(nodeOf(a).isConnectedTo(tap)).toBe(false)
    expect(nodeOf(b).isConnectedTo(tap)).toBe(true)

    // Removing a device that is not the tail leaves the tap alone.
    bus.removeInsert(a)
    expect(nodeOf(b).isConnectedTo(tap)).toBe(true)
    expect(nodeOf(b).connectCalls.count).toBe(2)

    bus.removeInsert(b)
    expect(fader.isConnectedTo(tap)).toBe(true)
    expect(fader.isConnectedTo(ctx.destination)).toBe(true)
  })

  it('survives connectTo and goes away with removeTap', () => {
    const { ctx, bus, tap, fader } = setup()
    bus.addTap(tap as unknown as AudioNode)
    const other = ctx.createGain()
    bus.connectTo(other as unknown as AudioNode)
    expect(fader.isConnectedTo(other)).toBe(true)
    expect(fader.isConnectedTo(tap)).toBe(true)

    bus.removeTap(tap as unknown as AudioNode)
    bus.removeTap(tap as unknown as AudioNode)
    expect(bus.taps).toEqual([])
    expect(fader.isConnectedTo(tap)).toBe(false)
    expect(fader.isConnectedTo(other)).toBe(true)
    expect(fader.disconnectCalls.calledWith(tap)).toBe(true)
  })

  it('dispose drops the taps', () => {
    const { bus, tap } = setup()
    bus.addTap(tap as unknown as AudioNode)
    bus.dispose()
    expect(bus.taps).toEqual([])
    expect(() => bus.addTap(tap as unknown as AudioNode)).toThrow(/disposed/)
  })
})
