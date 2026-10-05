import { describe, expect, it, vi } from 'vitest'

import {
  asAudioContext,
  asAudioNode,
  createMockContext,
  type MockAudioContext,
  type MockAudioNode,
  type MockAudioParam,
  type MockGainNode,
  type MockStereoPannerNode,
} from '../../../testing'
import { Bus, LEVEL_RAMP_SECONDS } from '../../buses/Bus'
import { type Device } from '../../devices/Device'
import { ChannelStrip, RIDE_ARRIVAL_TIME_CONSTANT, SoloInPlace } from '../ChannelStrip'

/** A device made of one gain node, enough to test insert wiring. */
function fakeDevice(ctx: MockAudioContext, id: string): Device {
  const node = ctx.createGain()
  return {
    id,
    input: asAudioNode(node),
    output: asAudioNode(node),
    params: {},
    setParam: () => {},
    getParam: () => 0,
    bypass: false,
    latencySec: 0,
    dispose: () => node.disconnect(),
  }
}

const RAMPS = new Set([
  'linearRampToValueAtTime',
  'exponentialRampToValueAtTime',
  'setTargetAtTime',
  'setValueCurveAtTime',
])

/** R2: a `setValueAtTime` step is only acceptable after a ramp on the same param. */
function expectNoUnrampedStep(param: MockAudioParam): void {
  param.events.forEach((event, index) => {
    if (event.method !== 'setValueAtTime') return
    const rampedBefore = param.events.slice(0, index).some((earlier) => RAMPS.has(earlier.method))
    expect(rampedBefore, `step ${JSON.stringify(event.args)} without a preceding ramp`).toBe(true)
  })
}

function sweepParams(ctx: MockAudioContext): void {
  for (const gain of ctx.gains) expectNoUnrampedStep(gain.gain)
  for (const panner of ctx.panners) expectNoUnrampedStep(panner.pan)
}

function gainParam(node: GainNode): MockAudioParam {
  return (node as unknown as MockGainNode).gain
}

function asMock(node: AudioNode): MockGainNode {
  return node as unknown as MockGainNode
}

function panParam(node: StereoPannerNode): MockAudioParam {
  return (node as unknown as MockStereoPannerNode).pan
}

/**
 * Makes a stand-in node throw when told to let go of a node it does not feed,
 * as a browser's node does (the stand-in alone lets it pass).
 */
function strict(node: MockAudioNode): void {
  vi.spyOn(node, 'disconnect').mockImplementation((...args: unknown[]) => {
    const [target] = args
    if (target === undefined) node.outputs.clear()
    else if (!node.outputs.delete(target as MockAudioNode)) {
      throw new Error('InvalidAccessError: the node is not connected to that one')
    }
  })
}

function strip(ctx: MockAudioContext, name: string, options: { solo?: SoloInPlace } = {}) {
  return new ChannelStrip(asAudioContext(ctx), {
    name,
    destination: asAudioNode(ctx.destination),
    ...options,
  })
}

describe('ChannelStrip topology', () => {
  it('creates no nodes until a feature is used; sources connect straight to the destination', () => {
    const ctx = createMockContext()
    const s = strip(ctx, 'a')
    const source = ctx.createGain()
    s.connectSource(asAudioNode(source))
    expect(ctx.gains).toHaveLength(1)
    expect(ctx.panners).toHaveLength(0)
    expect(source.isConnectedTo(ctx.destination)).toBe(true)
    expect(s.materialized).toBe(false)
    expect(s.destination).toBe(ctx.destination)
    expect(s.sourceNodes).toEqual([source])
    // State getters never create nodes.
    expect([s.level, s.pan, s.inputGain]).toEqual([1, 0, 1])
    expect([s.mute, s.solo, s.soloSafe, s.audible, s.implicitlyMuted]).toEqual([
      false,
      false,
      false,
      true,
      false,
    ])
    expect(s.inserts).toEqual([])
    expect(s.materialized).toBe(false)
  })

  it('materialize creates input gain → panner → fader → gate → destination and re-points live sources', () => {
    const ctx = createMockContext()
    const s = strip(ctx, 'a')
    const source = ctx.createGain()
    s.connectSource(asAudioNode(source))

    s.materialize()
    expect(s.materialized).toBe(true)
    const [, inputGain, fader, gate] = ctx.gains
    const [panner] = ctx.panners
    expect(ctx.gains).toHaveLength(4)
    expect(inputGain.id).toBeLessThan(panner.id)
    expect(panner.id).toBeLessThan(fader.id)
    expect(fader.id).toBeLessThan(gate.id)
    expect(s.input).toBe(inputGain)
    expect(s.inputGainNode).toBe(inputGain)
    expect(s.panner).toBe(panner)
    expect(s.fader).toBe(fader)
    expect(s.gate).toBe(gate)
    expect(s.output).toBe(gate)

    expect(inputGain.isConnectedTo(panner)).toBe(true)
    expect(panner.isConnectedTo(fader)).toBe(true)
    expect(fader.isConnectedTo(gate)).toBe(true)
    expect(gate.isConnectedTo(ctx.destination)).toBe(true)
    // Everything comes up at unity: the swap is inaudible.
    expect([inputGain.gain.value, panner.pan.value, fader.gain.value, gate.gain.value]).toEqual([
      1, 0, 1, 1,
    ])

    // The live source moved from the destination into the strip.
    expect(source.disconnectCalls.calledWith(ctx.destination)).toBe(true)
    expect(source.isConnectedTo(ctx.destination)).toBe(false)
    expect(source.isConnectedTo(inputGain)).toBe(true)
    expect(source.reaches(ctx.destination)).toBe(true)

    // Later sources go straight into the input gain; materialize is idempotent.
    const later = ctx.createGain()
    s.connectSource(asAudioNode(later))
    expect(later.isConnectedTo(inputGain)).toBe(true)
    s.materialize()
    expect(ctx.gains).toHaveLength(5)
  })

  it('node accessors materialize on demand', () => {
    const ctx = createMockContext()
    const s = strip(ctx, 'a')
    expect(s.materialized).toBe(false)
    expect(s.fader).toBe(ctx.gains[1])
    expect(s.materialized).toBe(true)
  })

  it('forgetSource and disconnectSource drop bookkeeping so a later materialize skips them', () => {
    const ctx = createMockContext()
    const s = strip(ctx, 'a')
    const a = ctx.createGain()
    const b = ctx.createGain()
    s.connectSource(asAudioNode(a))
    s.connectSource(asAudioNode(b))
    a.disconnect()
    s.forgetSource(asAudioNode(a))
    s.disconnectSource(asAudioNode(b))
    expect(b.disconnectCalls.calledWith(ctx.destination)).toBe(true)
    expect(s.sourceNodes).toEqual([])
    s.materialize()
    expect(a.disconnectCalls.count).toBe(1)
    expect(b.disconnectCalls.count).toBe(1)
    s.disconnectSource(asAudioNode(b))
    expect(b.disconnectCalls.count).toBe(1)
  })

  it('connectTo re-points every source while node-free and only the gate once built', () => {
    const ctx = createMockContext()
    const s = strip(ctx, 'a')
    const source = ctx.createGain()
    const busA = new Bus(asAudioContext(ctx), {
      name: 'A',
      destination: asAudioNode(ctx.destination),
    })
    const busB = new Bus(asAudioContext(ctx), {
      name: 'B',
      destination: asAudioNode(ctx.destination),
    })
    s.connectSource(asAudioNode(source))

    s.connectTo(busA)
    expect(source.isConnectedTo(ctx.destination)).toBe(false)
    expect(source.isConnectedTo(busA.input as never)).toBe(true)
    expect(s.destination).toBe(busA.input)
    expect(s.destinationTarget).toBe(busA)
    expect(s.parent).toBeNull()

    s.materialize()
    const gate = s.gate as unknown as typeof source
    s.sends.add(busB, { level: 0.5 })
    s.connectTo(asAudioNode(ctx.destination))
    expect(gate.isConnectedTo(busA.input as never)).toBe(false)
    expect(gate.isConnectedTo(ctx.destination)).toBe(true)
    // Re-routing leaves the post-fader send in place.
    expect(gate.reaches(busB.input as never)).toBe(true)
    expect(source.isConnectedTo(s.input as never)).toBe(true)
  })

  it('inserts sit between the input gain and the panner and rewire on add and remove', () => {
    const ctx = createMockContext()
    const s = strip(ctx, 'a')
    const a = fakeDevice(ctx, 'a')
    const b = fakeDevice(ctx, 'b')
    const gainOf = (device: Device) => device.input as unknown as MockAudioContext['gains'][number]

    s.addInsert(a)
    const inputGain = ctx.gains[2]
    const panner = ctx.panners[0]
    expect(s.input).toBe(inputGain)
    expect(inputGain.isConnectedTo(panner)).toBe(false)
    expect(inputGain.isConnectedTo(gainOf(a))).toBe(true)
    expect(gainOf(a).isConnectedTo(panner)).toBe(true)

    s.addInsert(b)
    s.addInsert(b)
    expect(s.inserts).toEqual([a, b])
    expect(gainOf(a).isConnectedTo(panner)).toBe(false)
    expect(gainOf(a).isConnectedTo(gainOf(b))).toBe(true)
    expect(gainOf(b).isConnectedTo(panner)).toBe(true)
    expect(inputGain.reaches(ctx.destination)).toBe(true)

    s.removeInsert(a)
    expect(s.inserts).toEqual([b])
    expect(inputGain.isConnectedTo(gainOf(b))).toBe(true)
    expect(inputGain.reaches(ctx.destination)).toBe(true)

    s.removeInsert(b)
    s.removeInsert(b)
    expect(s.inserts).toEqual([])
    expect(inputGain.isConnectedTo(panner)).toBe(true)
  })

  it('an insert that cannot be wired leaves the chain as it was, and the next one goes on', () => {
    const ctx = createMockContext()
    const s = strip(ctx, 'a')
    const good = fakeDevice(ctx, 'good')
    s.addInsert(good)
    const inputGain = asMock(s.input)
    const tail = asMock(good.output)
    const panner = ctx.panners[0]
    strict(tail)

    // Its output refuses the panner, as a node of another context does.
    const deaf = fakeDevice(ctx, 'deaf')
    vi.spyOn(asMock(deaf.output), 'connect').mockImplementation(() => {
      throw new Error('InvalidAccessError')
    })
    expect(() => s.addInsert(deaf)).toThrow(/InvalidAccessError/)
    expect(s.inserts).toEqual([good])
    expect(tail.isConnectedTo(panner)).toBe(true)
    expect(tail.isConnectedTo(asMock(deaf.input))).toBe(false)
    expect(inputGain.reaches(ctx.destination)).toBe(true)

    // Its input refuses the chain: the tail cannot be connected to it.
    const foreign = fakeDevice(ctx, 'foreign')
    vi.spyOn(tail, 'connect').mockImplementationOnce(() => {
      throw new Error('InvalidAccessError')
    })
    expect(() => s.addInsert(foreign)).toThrow(/InvalidAccessError/)
    expect(s.inserts).toEqual([good])
    expect(tail.isConnectedTo(panner)).toBe(true)
    expect(inputGain.reaches(ctx.destination)).toBe(true)

    const next = fakeDevice(ctx, 'next')
    s.addInsert(next)
    expect(s.inserts).toEqual([good, next])
    expect(tail.isConnectedTo(asMock(next.input))).toBe(true)
    expect(inputGain.reaches(ctx.destination)).toBe(true)
  })

  it('takes out an insert that was disposed first, and closes the chain around it', () => {
    const ctx = createMockContext()
    const s = strip(ctx, 'a')
    const first = fakeDevice(ctx, 'first')
    const gone = fakeDevice(ctx, 'gone')
    s.addInsert(first)
    s.addInsert(gone)
    const panner = ctx.panners[0]
    strict(asMock(first.output))
    strict(asMock(gone.output))

    // Disposed, it has let go of the panner itself.
    gone.dispose()
    s.removeInsert(gone)
    expect(s.inserts).toEqual([first])
    expect(asMock(first.output).isConnectedTo(panner)).toBe(true)
    expect(asMock(s.input).reaches(ctx.destination)).toBe(true)

    first.dispose()
    s.removeInsert(first)
    expect(s.inserts).toEqual([])
    expect(asMock(s.input).isConnectedTo(panner)).toBe(true)
  })

  it('post-fader sends tap the gate, so a mute silences them too', () => {
    const ctx = createMockContext()
    const s = strip(ctx, 'a')
    const aux = new Bus(asAudioContext(ctx), {
      name: 'aux',
      destination: asAudioNode(ctx.destination),
    })
    const direct = s.sends.add(aux)
    expect(s.materialized).toBe(true)
    const gate = ctx.gains[3]
    expect(s.gate).toBe(gate)
    expect(direct.gainNode).toBeNull()
    expect(gate.isConnectedTo(aux.input as never)).toBe(true)

    const other = new Bus(asAudioContext(ctx), {
      name: 'b',
      destination: asAudioNode(ctx.destination),
    })
    const levelled = s.sends.add(other, { level: 0.3 })
    expect(levelled.gainNode?.gain.value).toBe(0.3)
    expect(gate.isConnectedTo(levelled.gainNode as never)).toBe(true)
    expect(s.sends.all()).toHaveLength(2)
    s.sends.remove(aux)
    expect(s.sends.all().map((send) => send.target)).toEqual([other])
  })

  it('dispose disconnects the nodes, forgets sources and refuses further use', () => {
    const ctx = createMockContext()
    const s = strip(ctx, 'a')
    const source = ctx.createGain()
    s.connectSource(asAudioNode(source))
    s.addInsert(fakeDevice(ctx, 'x'))
    s.dispose()
    s.dispose()
    // Input gain: once for the insert rewiring, once (fully) on dispose.
    expect(ctx.gains[2].disconnectCalls.count).toBe(2)
    expect(ctx.gains[2].disconnectCalls.last).toEqual([])
    expect(ctx.panners[0].disconnectCalls.count).toBe(1)
    expect(ctx.gains[3].disconnectCalls.count).toBe(1) // fader
    expect(ctx.gains[4].disconnectCalls.count).toBe(1) // gate
    expect(ctx.gains[1].disconnectCalls.count).toBe(1) // the insert's output
    expect(s.sourceNodes).toEqual([])
    expect(s.inserts).toEqual([])
    expect(() => s.connectSource(asAudioNode(source))).toThrow(/disposed/)
    expect(() => s.setLevel(0.5)).toThrow(/disposed/)
  })

  it('without a context it can only build nodes when the destination carries one', () => {
    const ctx = createMockContext()
    const bare = new ChannelStrip(null, { name: 'bare', destination: asAudioNode(ctx.destination) })
    const source = ctx.createGain()
    bare.connectSource(asAudioNode(source))
    expect(source.isConnectedTo(ctx.destination)).toBe(true)
    expect(() => bare.setLevel(0.5)).toThrow(/needs an AudioContext/)

    const destination = Object.assign(ctx.createGain(), { context: ctx })
    const derived = new ChannelStrip(null, {
      name: 'derived',
      destination: asAudioNode(destination),
    })
    derived.setLevel(0.5)
    expect(derived.materialized).toBe(true)
    expect(ctx.gains).toHaveLength(5)
  })
})

describe('ChannelStrip ramps (R2)', () => {
  it('setLevel, setPan and setInputGain approach with setTargetAtTime at now and the 5 ms constant', () => {
    const ctx = createMockContext({ currentTime: 3 })
    const s = strip(ctx, 'a')
    expect(s.timeConstant).toBe(LEVEL_RAMP_SECONDS)

    s.setLevel(0.5)
    // The nodes were created at unity and only then ramped: no step on the swap.
    expect(gainParam(s.fader).value).toBe(1)
    expect(gainParam(s.fader).events).toEqual([
      { method: 'setTargetAtTime', args: [0.5, 3, 0.005] },
    ])
    s.setLevel(-1, { at: 4, timeConstant: 0.05 })
    expect(gainParam(s.fader).lastEvent('setTargetAtTime')?.args).toEqual([0, 4, 0.05])
    expect(s.level).toBe(0)

    s.setPan(2)
    expect(panParam(s.panner).events).toEqual([{ method: 'setTargetAtTime', args: [1, 3, 0.005] }])
    s.setPan(-1.5)
    expect(s.pan).toBe(-1)

    s.setInputGain(2, { at: 5 })
    expect(gainParam(s.inputGainNode).events).toEqual([
      { method: 'setTargetAtTime', args: [2, 5, 0.005] },
    ])
    expect(s.inputGain).toBe(2)
    sweepParams(ctx)
  })

  it('a custom time constant applies to every ramp on the strip', () => {
    const ctx = createMockContext({ currentTime: 1 })
    const s = new ChannelStrip(asAudioContext(ctx), {
      name: 'slow',
      destination: asAudioNode(ctx.destination),
      timeConstant: 0.02,
    })
    s.setLevel(0.2)
    s.mute = true
    expect(gainParam(s.fader).lastEvent('setTargetAtTime')?.args).toEqual([0.2, 1, 0.02])
    expect(gainParam(s.gate).lastEvent('setTargetAtTime')?.args).toEqual([0, 1, 0.02])
  })

  it('mute ramps the gate to 0 and back, once per change', () => {
    const ctx = createMockContext({ currentTime: 2 })
    const s = strip(ctx, 'a')
    s.mute = false
    expect(s.materialized).toBe(false)

    s.mute = true
    expect(s.materialized).toBe(true)
    expect(gainParam(s.gate).value).toBe(1)
    expect(gainParam(s.gate).events).toEqual([{ method: 'setTargetAtTime', args: [0, 2, 0.005] }])
    expect(s.audible).toBe(false)
    s.mute = true
    expect(gainParam(s.gate).events).toHaveLength(1)

    ctx.currentTime = 4
    s.setMute(false, { at: 5 })
    expect(gainParam(s.gate).events[1]).toEqual({ method: 'setTargetAtTime', args: [1, 5, 0.005] })
    expect(s.audible).toBe(true)
    sweepParams(ctx)
  })

  it('an initial level materializes at that value before any audio flows', () => {
    const ctx = createMockContext()
    const s = new ChannelStrip(asAudioContext(ctx), {
      name: 'g',
      destination: asAudioNode(ctx.destination),
      level: 0.5,
    })
    expect(s.materialized).toBe(true)
    expect(s.level).toBe(0.5)
    expect(gainParam(s.fader).value).toBe(0.5)
    expect(gainParam(s.fader).events).toEqual([])
  })

  it('a full session leaves no gain or pan param with an unramped step', () => {
    const ctx = createMockContext({ currentTime: 1 })
    const solo = new SoloInPlace()
    const a = strip(ctx, 'a', { solo })
    const b = strip(ctx, 'b', { solo })
    const source = ctx.createGain()
    a.connectSource(asAudioNode(source))
    a.setLevel(0.7)
    a.setPan(-0.3)
    a.setInputGain(1.2)
    b.mute = true
    b.mute = false
    a.solo = true
    a.solo = false
    b.solo = true
    solo.clear()
    a.connectTo(asAudioNode(ctx.createGain()))
    a.addInsert(fakeDevice(ctx, 'd'))
    sweepParams(ctx)
    expect(ctx.gains.flatMap((g) => g.gain.events).length).toBeGreaterThan(5)
  })
})

describe('ChannelStrip.shadow', () => {
  it('is a fader and a gate that take every ramp the strip gives its own', () => {
    const ctx = createMockContext({ currentTime: 2 })
    const s = strip(ctx, 'a')
    const shadow = s.shadow()
    // An untouched strip stays without nodes; the shadow is at unity like it.
    expect(s.materialized).toBe(false)
    expect(gainParam(shadow.input).value).toBe(1)
    expect(gainParam(shadow.output).value).toBe(1)
    expect((shadow.input as unknown as MockGainNode).isConnectedTo(asMock(shadow.output))).toBe(
      true,
    )

    s.setLevel(0.5, { at: 3, timeConstant: 0.02 })
    expect(gainParam(shadow.input).events).toEqual(gainParam(s.fader).events)
    s.mute = true
    s.mute = false
    expect(gainParam(shadow.output).events).toEqual(gainParam(s.gate).events)
    // Pan and input trim are not a level the shadow can carry.
    s.setPan(0.5)
    s.setInputGain(2)
    expect(gainParam(shadow.input).events).toHaveLength(1)
    expect(gainParam(shadow.output).events).toHaveLength(2)
  })

  it('starts where the strip stands, and stops following once released', () => {
    const ctx = createMockContext({ currentTime: 1 })
    const s = strip(ctx, 'a')
    s.setLevel(0.25)
    s.mute = true
    const shadow = s.shadow()
    // The strip's own nodes are still on their way; the shadow makes the same approach.
    expect(gainParam(shadow.input).lastEvent('setTargetAtTime')?.args).toEqual([0.25, 1, 0.005])
    expect(gainParam(shadow.output).lastEvent('setTargetAtTime')?.args).toEqual([0, 1, 0.005])

    shadow.release()
    s.setLevel(1)
    expect(gainParam(shadow.input).events).toHaveLength(1)
    expect((shadow.input as unknown as MockGainNode).outputs.size).toBe(0)
  })

  it('tap hears the output and every shadow, the ones made later too', () => {
    const ctx = createMockContext()
    const s = strip(ctx, 'a')
    const before = s.shadow()
    const meter = ctx.createGain()
    const untap = s.tap(asAudioNode(meter))
    const after = s.shadow()
    expect(asMock(s.output).isConnectedTo(meter)).toBe(true)
    expect(asMock(before.output).isConnectedTo(meter)).toBe(true)
    expect(asMock(after.output).isConnectedTo(meter)).toBe(true)

    untap()
    expect(asMock(s.output).isConnectedTo(meter)).toBe(false)
    expect(asMock(before.output).isConnectedTo(meter)).toBe(false)
    const later = s.shadow()
    expect(asMock(later.output).isConnectedTo(meter)).toBe(false)
  })

  it('says whether it has a send without making one', () => {
    const ctx = createMockContext()
    const s = strip(ctx, 'a')
    expect(s.hasSends).toBe(false)
    expect(s.materialized).toBe(false)
  })
})

describe('SoloInPlace', () => {
  function rig(currentTime = 0) {
    const ctx = createMockContext({ currentTime })
    const solo = new SoloInPlace()
    const a = strip(ctx, 'a', { solo })
    const b = strip(ctx, 'b', { solo })
    const safe = new ChannelStrip(asAudioContext(ctx), {
      name: 'return',
      destination: asAudioNode(ctx.destination),
      soloSafe: true,
      solo,
    })
    return { ctx, solo, a, b, safe }
  }

  it('soloing mutes the other non-safe strips by a ramp and leaves the soloed and safe ones node-free', () => {
    const { ctx, solo, a, b, safe } = rig(2)
    expect(solo.registered).toEqual([a, b, safe])
    expect(solo.active).toBe(false)

    a.solo = true
    expect(solo.active).toBe(true)
    expect(solo.soloed).toEqual([a])
    expect(a.materialized).toBe(false)
    expect(safe.materialized).toBe(false)
    expect(b.materialized).toBe(true)
    expect(b.implicitlyMuted).toBe(true)
    expect(b.audible).toBe(false)
    expect(b.mute).toBe(false)
    expect(gainParam(b.gate).events).toEqual([{ method: 'setTargetAtTime', args: [0, 2, 0.005] }])
    expect(a.audible).toBe(true)
    expect(safe.audible).toBe(true)

    ctx.currentTime = 3
    a.solo = false
    expect(solo.active).toBe(false)
    expect(b.implicitlyMuted).toBe(false)
    expect(b.audible).toBe(true)
    expect(gainParam(b.gate).events[1]).toEqual({ method: 'setTargetAtTime', args: [1, 3, 0.005] })
    expect(ctx.gains).toHaveLength(3)
    sweepParams(ctx)
  })

  it('two soloed strips are both audible; releasing one keeps the other solo in force', () => {
    const { solo, a, b, safe } = rig()
    a.solo = true
    b.solo = true
    expect([a.audible, b.audible, safe.audible]).toEqual([true, true, true])
    expect(a.materialized).toBe(false)
    expect(gainParam(b.gate).events.map((e) => e.args)).toEqual([
      [0, 0, 0.005],
      [1, 0, 0.005],
    ])
    a.solo = false
    expect(a.implicitlyMuted).toBe(true)
    expect(b.audible).toBe(true)
    expect(solo.soloed).toEqual([b])
  })

  it('an explicit mute wins over solo', () => {
    const { a, b } = rig()
    b.mute = true
    b.solo = true
    expect(b.audible).toBe(false)
    expect(gainParam(b.gate).events).toHaveLength(1) // still the mute's ramp to 0
    expect(a.implicitlyMuted).toBe(true)
    b.mute = false
    expect(b.audible).toBe(true)
    expect(gainParam(b.gate).lastEvent('setTargetAtTime')?.args[0]).toBe(1)
  })

  it('soloSafe toggles take effect immediately', () => {
    const { a, b, safe } = rig()
    a.solo = true
    safe.soloSafe = false
    expect(safe.implicitlyMuted).toBe(true)
    safe.soloSafe = true
    expect(safe.implicitlyMuted).toBe(false)
    expect(b.implicitlyMuted).toBe(true)
  })

  it('clear un-solos everything with the given ramp options', () => {
    const { solo, a, b } = rig()
    a.solo = true
    solo.clear({ at: 9, timeConstant: 0.02 })
    expect(solo.active).toBe(false)
    expect(a.solo).toBe(false)
    expect(gainParam(b.gate).lastEvent('setTargetAtTime')?.args).toEqual([1, 9, 0.02])
  })

  it('setSolo passes ramp options through to the strips it mutes', () => {
    const { a, b } = rig()
    a.setSolo(true, { at: 5, timeConstant: 0.03 })
    expect(gainParam(b.gate).events).toEqual([{ method: 'setTargetAtTime', args: [0, 5, 0.03] }])
  })

  it('a strip created during a solo comes up muted; disposing the soloed strip releases the rest', () => {
    const { ctx, solo, a, b } = rig()
    a.solo = true
    const late = strip(ctx, 'late', { solo })
    expect(late.materialized).toBe(true)
    expect(late.implicitlyMuted).toBe(true)
    expect(gainParam(late.gate).events).toEqual([
      { method: 'setTargetAtTime', args: [0, 0, 0.005] },
    ])

    a.dispose()
    expect(solo.registered).toEqual([b, expect.anything(), late])
    expect(solo.active).toBe(false)
    expect(b.audible).toBe(true)
    expect(late.audible).toBe(true)
  })

  it('without a registry, solo is only a flag', () => {
    const ctx = createMockContext()
    const a = strip(ctx, 'a')
    const b = strip(ctx, 'b')
    a.solo = true
    expect(a.solo).toBe(true)
    expect(b.implicitlyMuted).toBe(false)
    expect(ctx.gains).toHaveLength(0)
  })
})

/** A ride's gain, which is there once the ride has been moved. */
function rideOf(s: ChannelStrip, layer?: string): GainNode {
  const node = s.rideNode(layer)
  if (!node) throw new Error('the strip has no such ride')
  return node
}

describe('ChannelStrip.setRide', () => {
  it('makes no node until a ride is moved, then one gain between the fader and the gate', () => {
    const ctx = createMockContext({ currentTime: 3 })
    const s = strip(ctx, 'a')
    s.setLevel(0.5)
    expect(ctx.gains).toHaveLength(3)
    expect(s.ride()).toBe(1)
    expect(s.rideNode()).toBeNull()

    s.setRide(0, { at: 4, timeConstant: 1 })
    expect(ctx.gains).toHaveLength(4)
    const ride = asMock(rideOf(s))
    expect(asMock(s.fader).isConnectedTo(ride)).toBe(true)
    expect(asMock(s.fader).isConnectedTo(asMock(s.gate))).toBe(false)
    expect(ride.isConnectedTo(asMock(s.gate))).toBe(true)
    // It comes up at unity and only then approaches, so making it does not step.
    expect(ride.gain.value).toBe(1)
    expect(ride.gain.lastEvent('setTargetAtTime')?.args).toEqual([0, 4, 1])
    expect(s.ride()).toBe(0)
    // The fader still says what the mix is.
    expect(s.level).toBe(0.5)
    sweepParams(ctx)
  })

  it('keeps the fader and the ride apart: a level change does not touch a ride in flight', () => {
    const ctx = createMockContext({ currentTime: 0 })
    const s = strip(ctx, 'a')
    s.setRide(0, { at: 2, timeConstant: 1 })
    const ride = gainParam(rideOf(s))
    const before = ride.events.length
    s.setLevel(0.25)
    expect(ride.events).toHaveLength(before)
    expect(gainParam(s.fader).lastEvent('setTargetAtTime')?.args).toEqual([
      0.25,
      0,
      LEVEL_RAMP_SECONDS,
    ])
  })

  it('drops an approach still to come for the new one, so the last word wins', () => {
    const ctx = createMockContext({ currentTime: 10 })
    const s = strip(ctx, 'a')
    s.setRide(0, { at: 12, timeConstant: 1 })
    s.setRide(1, { at: 10.5, timeConstant: 0.1 })
    const ride = gainParam(rideOf(s))
    expect(ride.events.map((event) => event.method)).toEqual([
      'cancelScheduledValues',
      'setTargetAtTime',
      'cancelScheduledValues',
      'setTargetAtTime',
    ])
    expect(ride.lastEvent('cancelScheduledValues')?.args).toEqual([10])
    expect(ride.lastEvent('setTargetAtTime')?.args).toEqual([1, 10.5, 0.1])
  })

  it('arrives when it is told to: a second, short approach from there closes what the first left', () => {
    const ctx = createMockContext({ currentTime: 10 })
    const s = strip(ctx, 'a')
    const shadow = s.shadow()
    s.setRide(0, { at: 12, timeConstant: 1, arriveAt: 16 })
    const [shadowRide] = [...asMock(shadow.input).outputs] as MockGainNode[]
    for (const ride of [gainParam(rideOf(s)), shadowRide.gain]) {
      expect(ride.eventsFor('setTargetAtTime').map((event) => event.args)).toEqual([
        [0, 12, 1],
        [0, 16, RIDE_ARRIVAL_TIME_CONSTANT],
      ])
    }
    // A new word drops the arrival with the approach it closed.
    s.setRide(1, { at: 13, timeConstant: 0.5 })
    const ride = gainParam(rideOf(s))
    expect(ride.events.slice(-2).map((event) => [event.method, ...event.args])).toEqual([
      ['cancelScheduledValues', 10],
      ['setTargetAtTime', 1, 13, 0.5],
    ])
  })

  it('has nothing to close when the arrival is no later than the start, or the approach is as quick', () => {
    const ctx = createMockContext({ currentTime: 10 })
    const s = strip(ctx, 'a')
    s.setRide(0, { at: 12, timeConstant: 1, arriveAt: 12 })
    s.setRide(0.5, { timeConstant: 1, arriveAt: 9 })
    s.setRide(0.25, { at: 12, timeConstant: RIDE_ARRIVAL_TIME_CONSTANT, arriveAt: 12.08 })
    expect(
      gainParam(rideOf(s))
        .eventsFor('setTargetAtTime')
        .map((event) => event.args),
    ).toEqual([
      [0, 12, 1],
      [0.5, 10, 1],
      [0.25, 12, RIDE_ARRIVAL_TIME_CONSTANT],
    ])
  })

  it('stacks named layers in the order they were first moved, each with its own value', () => {
    const ctx = createMockContext()
    const s = strip(ctx, 'a')
    s.setRide(0.5, { layer: 'scene' })
    s.setRide(0.25, { layer: 'dial' })
    expect(s.rideLayers).toEqual(['scene', 'dial'])
    const scene = asMock(rideOf(s, 'scene'))
    const dial = asMock(rideOf(s, 'dial'))
    expect(asMock(s.fader).isConnectedTo(scene)).toBe(true)
    expect(scene.isConnectedTo(dial)).toBe(true)
    expect(scene.isConnectedTo(asMock(s.gate))).toBe(false)
    expect(dial.isConnectedTo(asMock(s.gate))).toBe(true)
    expect(s.ride('scene')).toBe(0.5)
    expect(s.ride('dial')).toBe(0.25)
    s.setRide(-1, { layer: 'scene' })
    expect(s.ride('scene')).toBe(0)
    expect(s.ride('dial')).toBe(0.25)
  })

  it('rides a shadow as it rides the strip, whichever was made first', () => {
    const ctx = createMockContext({ currentTime: 1 })
    const s = strip(ctx, 'a')
    const before = s.shadow()
    s.setRide(0, { layer: 'scene', at: 2, timeConstant: 1 })
    const after = s.shadow()
    s.setRide(0.5, { layer: 'scene', at: 3, timeConstant: 0.5 })

    for (const shadow of [before, after]) {
      const input = asMock(shadow.input)
      const output = asMock(shadow.output)
      // fader, the shadow's own ride, gate: nothing goes round the ride.
      expect(input.isConnectedTo(output)).toBe(false)
      const [ride] = [...input.outputs] as MockGainNode[]
      expect(ride.isConnectedTo(output)).toBe(true)
      expect(ride.gain.lastEvent('setTargetAtTime')?.args).toEqual([0.5, 3, 0.5])
    }
    after.release()
    s.setRide(1, { layer: 'scene' })
    const [released] = [...asMock(after.input).outputs]
    expect(released).toBeUndefined()
  })
})
