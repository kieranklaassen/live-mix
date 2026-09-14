import { describe, expect, it, vi } from 'vitest'

import { ModMatrix } from '../../automation/ModMatrix'
import { Macro } from '../../automation/Modulator'
import {
  asAudioContext,
  createMockContext,
  type MockAudioContext,
  type MockAudioNode,
  type MockGainNode,
} from '../../../testing'
import { type ParamSpec } from '../../params'
import { type Device, isObservableDevice } from '../Device'
import { devices } from '../index'
import { macroMappedValue } from '../Macro'
import { NODE_DEVICE_RAMP_SECONDS } from '../native/NodeDevice'
import { createCompressor } from '../native/Compressor'
import { createFilter } from '../native/Filter'
import { UTILITY_DESCRIPTOR, createUtility } from '../native/Utility'
import { PDC_MAX_DELAY_SECONDS } from '../pdc'
import { applyPreset, capturePreset } from '../presets'
import { DeviceRegistry, validateDescriptor } from '../registry'
import {
  DEFAULT_MACRO_COUNT,
  RACK_DESCRIPTOR,
  RACK_PARAMS,
  Rack,
  captureRackPreset,
  createRack,
  createRackFromPreset,
  macroIndexOf,
  macroParamName,
  parseRackPreset,
  rackParams,
  serializeRackPreset,
  type RackPreset,
} from '../Rack'

const SR = 48000

const FAKE_PARAMS = {
  amount: { id: 0, name: 'Amount', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' },
} as const satisfies Record<string, ParamSpec>

/** A one-gain device with a configurable sample latency. */
function fakeDevice(
  mock: MockAudioContext,
  id: string,
  latencySamples: number,
): Device & { node: MockGainNode; values: Map<string, number> } {
  const node = mock.createGain()
  const values = new Map<string, number>()
  return {
    id,
    node,
    values,
    input: node as unknown as AudioNode,
    output: node as unknown as AudioNode,
    params: FAKE_PARAMS,
    setParam: (name, value) => void values.set(name, value),
    getParam: (name) => values.get(name) ?? FAKE_PARAMS.amount.default,
    bypass: false,
    latencySec: latencySamples / SR,
    latencySamples,
    dispose: () => node.disconnect(),
  }
}

function make(options: { currentTime?: number } = {}) {
  const mock = createMockContext({ sampleRate: SR, currentTime: options.currentTime ?? 1 })
  const ctx = asAudioContext(mock)
  const rack = new Rack(ctx)
  const [input, output, dry, wet, sum] = mock.gains
  return { mock, ctx, rack, input, output, dry, wet, sum }
}

const asMock = (node: AudioNode) => node as unknown as MockAudioNode
const delayEvents = (mock: MockAudioContext, index: number) =>
  mock.delays[index].delayTime.eventsFor('setValueAtTime')

describe('Rack graph', () => {
  it('an empty rack is a pass-through: input → sum → wet → output beside input → dry → output', () => {
    const { mock, rack, input, output, dry, wet, sum } = make()
    expect(rack.id).toBe('rack')
    expect(rack.input).toBe(input)
    expect(rack.output).toBe(output)
    expect(rack.sum).toBe(sum)
    expect(mock.gains).toHaveLength(5)
    expect(mock.delays).toHaveLength(0)
    expect(input.outputs).toEqual(new Set([dry, sum]))
    expect(dry.outputs).toEqual(new Set([output]))
    expect(sum.outputs).toEqual(new Set([wet]))
    expect(wet.outputs).toEqual(new Set([output]))
    expect(dry.gain.value).toBe(0)
    expect(wet.gain.value).toBe(1)
    expect(rack.chains).toEqual([])
    expect(rack.latencySamples).toBe(0)
    expect(rack.latencySec).toBe(0)
    expect(rack.bypass).toBe(false)
  })

  it('a chain is input → inserts → delay → pan → fader → gate → sum, and replaces the pass-through', () => {
    const { mock, rack, input, sum } = make()
    const chain = rack.addChain({ name: 'A' })
    expect(chain.name).toBe('A')
    expect(mock.gains).toHaveLength(8)
    expect(mock.delays).toHaveLength(1)
    expect(mock.panners).toHaveLength(1)
    expect(input.outputs.has(sum)).toBe(false)
    expect(input.outputs.has(asMock(chain.input))).toBe(true)
    expect(asMock(chain.input).outputs).toEqual(new Set([mock.delays[0]]))
    expect(mock.delays[0].outputs).toEqual(new Set([mock.panners[0]]))
    expect(mock.panners[0].outputs).toEqual(new Set([asMock(chain.fader)]))
    expect(asMock(chain.fader).outputs).toEqual(new Set([asMock(chain.gate)]))
    expect(asMock(chain.gate).outputs).toEqual(new Set([sum]))
    expect(chain.output).toBe(chain.gate)
    expect(mock.delays[0].delayTime.value).toBe(0)

    const utility = createUtility(asAudioContext(mock))
    chain.addInsert(utility)
    chain.addInsert(utility)
    expect(chain.inserts).toEqual([utility])
    expect(asMock(chain.input).outputs).toEqual(new Set([asMock(utility.input)]))
    expect(asMock(utility.output).outputs.has(mock.delays[0])).toBe(true)

    const filter = createFilter(asAudioContext(mock))
    chain.addInsert(filter)
    expect(asMock(utility.output).outputs).toEqual(new Set([asMock(filter.input)]))
    expect(asMock(filter.output).outputs.has(mock.delays[0])).toBe(true)

    chain.removeInsert(utility)
    expect(chain.inserts).toEqual([filter])
    expect(asMock(chain.input).outputs).toEqual(new Set([asMock(filter.input)]))
    chain.removeInsert(utility)
    chain.removeInsert(filter)
    expect(asMock(chain.input).outputs).toEqual(new Set([mock.delays[0]]))
  })

  it('runs chains in parallel and names them by default', () => {
    const { mock, rack, input, sum } = make()
    const a = rack.addChain()
    const b = rack.addChain()
    expect([a.name, b.name]).toEqual(['Chain 1', 'Chain 2'])
    expect(input.outputs.has(asMock(a.input))).toBe(true)
    expect(input.outputs.has(asMock(b.input))).toBe(true)
    expect(asMock(a.gate).outputs).toEqual(new Set([sum]))
    expect(asMock(b.gate).outputs).toEqual(new Set([sum]))
    expect(mock.delays).toHaveLength(2)
    expect(rack.chains).toEqual([a, b])
  })

  it('removing the last chain restores the pass-through and disposes the chain (and its devices by default)', () => {
    const { mock, rack, input, sum } = make()
    const chain = rack.addChain()
    const utility = createUtility(asAudioContext(mock))
    chain.addInsert(utility)
    const kept = rack.addChain()
    const keptDevice = createUtility(asAudioContext(mock))
    kept.addInsert(keptDevice)

    rack.removeChain(kept, { disposeDevices: false })
    expect(rack.chains).toEqual([chain])
    expect(input.outputs.has(asMock(kept.input))).toBe(false)
    expect(asMock(keptDevice.input).disconnectCalls.count).toBe(0)
    expect(() => kept.addInsert(keptDevice)).toThrow(/disposed/)

    rack.removeChain(chain)
    rack.removeChain(chain)
    expect(rack.chains).toEqual([])
    expect(input.outputs).toEqual(new Set([mock.gains[2], sum]))
    expect(asMock(utility.input).disconnectCalls.count).toBe(1)
    expect(asMock(chain.gate).outputs.size).toBe(0)
  })

  it('takes chains up front', () => {
    const { rack } = make()
    const withChains = new Rack(asAudioContext(createMockContext({ sampleRate: SR })), {
      name: 'Drums',
      chains: [
        { name: 'Low', pan: -0.5 },
        { name: 'High', gain: 0.5, mute: true },
      ],
    })
    expect(withChains.name).toBe('Drums')
    expect(withChains.chains.map((chain) => chain.name)).toEqual(['Low', 'High'])
    expect(withChains.chains[0].pan).toBe(-0.5)
    expect(withChains.chains[1].gain).toBe(0.5)
    expect(withChains.chains[1].mute).toBe(true)
    expect(rack.name).toBe('Rack')
  })
})

describe('Chain level, pan and mute', () => {
  it('sets initial values outright and ramps changes over 5 ms with hold-now + linear ramp', () => {
    const { mock, rack } = make({ currentTime: 3 })
    const chain = rack.addChain({ gain: 0.8, pan: -0.25, mute: true })
    const fader = asMock(chain.fader) as MockGainNode
    const gate = asMock(chain.gate) as MockGainNode
    expect(fader.gain.value).toBe(0.8)
    expect(mock.panners[0].pan.value).toBe(-0.25)
    expect(gate.gain.value).toBe(0)
    expect(fader.gain.events).toEqual([])

    chain.setGain(0.5)
    expect(chain.gain).toBe(0.5)
    expect(fader.gain.events).toEqual([
      { method: 'cancelAndHoldAtTime', args: [3] },
      { method: 'linearRampToValueAtTime', args: [0.5, 3 + NODE_DEVICE_RAMP_SECONDS] },
    ])
    chain.setPan(2)
    expect(chain.pan).toBe(1)
    expect(mock.panners[0].pan.lastEvent('linearRampToValueAtTime')?.args).toEqual([
      1,
      3 + NODE_DEVICE_RAMP_SECONDS,
    ])
    chain.mute = false
    chain.mute = false
    expect(chain.mute).toBe(false)
    expect(gate.gain.eventsFor('linearRampToValueAtTime')).toEqual([
      { method: 'linearRampToValueAtTime', args: [1, 3 + NODE_DEVICE_RAMP_SECONDS] },
    ])
    chain.setMute(true, 0.05)
    expect(gate.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([0, 3.05])
    chain.setGain(-1)
    expect(chain.gain).toBe(0)
    chain.setGain(Number.NaN)
    expect(chain.gain).toBe(1)
  })

  it('stores key and selector zones for later routing', () => {
    const { rack } = make()
    const chain = rack.addChain({
      keyZone: { low: 36, high: 60 },
      selectorZone: { low: 0, high: 63 },
    })
    expect(chain.keyZone).toEqual({ low: 36, high: 60 })
    expect(chain.selectorZone).toEqual({ low: 0, high: 63 })
    expect(rack.addChain().keyZone).toBeNull()
  })
})

describe('Rack as a Device: params, mix and bypass', () => {
  it('has macro1..macro8 and mix, matching the descriptor', () => {
    const { rack } = make()
    expect(Object.keys(rack.params)).toEqual([
      ...Array.from({ length: DEFAULT_MACRO_COUNT }, (_, i) => `macro${i + 1}`),
      'mix',
    ])
    expect(rack.params).toBe(RACK_PARAMS)
    expect(rack.macros).toHaveLength(8)
    expect(rack.macros[3].name).toBe('Macro 4')
    expect(macroParamName(0)).toBe('macro1')
    expect(macroIndexOf('macro8')).toBe(7)
    expect(macroIndexOf('macro0')).toBeNull()
    expect(macroIndexOf('mix')).toBeNull()
    expect(() => validateDescriptor(RACK_DESCRIPTOR)).not.toThrow()
    expect(devices.has('rack')).toBe(true)
    expect(devices.list({ kind: 'node' }).map((d) => d.id)).not.toContain('rack')
  })

  it('supports a different macro count and rejects nonsense', () => {
    const rack = createRack(asAudioContext(createMockContext()), { macroCount: 2 })
    expect(Object.keys(rack.params)).toEqual(['macro1', 'macro2', 'mix'])
    expect(rack.macros).toHaveLength(2)
    expect(() => rack.setParam('macro3', 1)).toThrow(/no parameter "macro3"/)
    expect(() => rackParams(0)).toThrow(/1\.\.32/)
    expect(() => rackParams(2.5)).toThrow(/1\.\.32/)
  })

  it('clamps and tracks macro values through setParam and the Macro objects alike', () => {
    const { rack } = make()
    rack.setParam('macro1', 0.4)
    expect(rack.getParam('macro1')).toBe(0.4)
    expect(rack.macros[0].value).toBe(0.4)
    rack.macros[0].set(2)
    expect(rack.getParam('macro1')).toBe(1)
    rack.setParam('macro1', Number.NaN)
    expect(rack.getParam('macro1')).toBe(0)
    expect(() => rack.setParam('nope', 1)).toThrow(/no parameter "nope"/)
    expect(() => rack.getParam('nope')).toThrow(/no parameter "nope"/)
  })

  it('mix is a linear dry/wet law, initial values set outright, changes ramped', () => {
    const mock = createMockContext({ sampleRate: SR, currentTime: 2 })
    const rack = new Rack(asAudioContext(mock), { params: { mix: 0.25, macro2: 0.5 } })
    const [, , dry, wet] = mock.gains
    expect(rack.getParam('mix')).toBe(0.25)
    expect(rack.getParam('macro2')).toBe(0.5)
    expect(dry.gain.value).toBe(0.75)
    expect(wet.gain.value).toBe(0.25)
    expect(dry.gain.events).toEqual([])

    rack.setParam('mix', 0.6)
    expect(dry.gain.events).toEqual([
      { method: 'cancelAndHoldAtTime', args: [2] },
      { method: 'linearRampToValueAtTime', args: [0.4, 2 + NODE_DEVICE_RAMP_SECONDS] },
    ])
    expect(wet.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([
      0.6,
      2 + NODE_DEVICE_RAMP_SECONDS,
    ])
  })

  it('bypass crossfades to dry and back to the mix, once per change', () => {
    const { mock, rack, dry, wet } = make({ currentTime: 5 })
    rack.setParam('mix', 0.3)
    rack.bypass = true
    rack.bypass = true
    expect(rack.bypass).toBe(true)
    expect(dry.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([1, 5.005])
    expect(wet.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([0, 5.005])
    expect(dry.gain.eventsFor('linearRampToValueAtTime')).toHaveLength(2)

    rack.setParam('mix', 0.9)
    expect(dry.gain.eventsFor('linearRampToValueAtTime')).toHaveLength(2)

    mock.advanceClock(1)
    rack.bypass = false
    expect(dry.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([
      0.09999999999999998, 6.005,
    ])
    expect(wet.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([0.9, 6.005])
  })

  it('disposes chains and their devices, then stays inert', () => {
    const { mock, rack, input, output, dry, wet, sum } = make()
    const chain = rack.addChain()
    const utility = createUtility(asAudioContext(mock))
    chain.addInsert(utility)
    const nested = createRack(asAudioContext(mock))
    chain.addInsert(nested)

    rack.dispose()
    rack.dispose()
    for (const node of [input, output, dry, wet, sum]) {
      expect(node.disconnectCalls.last).toEqual([])
      expect(node.outputs.size).toBe(0)
    }
    // The input already disconnected the pass-through when the chain was added.
    expect(input.disconnectCalls.count).toBe(2)
    for (const node of [output, dry, wet, sum]) expect(node.disconnectCalls.count).toBe(1)
    expect(asMock(utility.input).disconnectCalls.count).toBe(1)
    expect(asMock(nested.input).disconnectCalls.count).toBe(1)
    expect(rack.chains).toEqual([])
    expect(() => rack.setParam('macro1', 0.5)).not.toThrow()
    expect(rack.getParam('macro1')).toBe(0.5)
    expect(() => {
      rack.bypass = true
    }).not.toThrow()
    expect(dry.gain.events).toEqual([])
    expect(() => rack.addChain()).toThrow(/disposed/)
    expect(() => rack.mapMacro(0, utility, 'gainDb')).toThrow(/disposed/)
  })
})

describe('Rack macros', () => {
  function withDevices() {
    const built = make()
    const chain = built.rack.addChain()
    const utility = createUtility(built.ctx)
    const filter = createFilter(built.ctx)
    chain.addInsert(utility)
    chain.addInsert(filter)
    return { ...built, chain, utility, filter }
  }

  it("a macro's first mapping adopts the param's position, so nothing jumps", () => {
    const { rack, utility } = withDevices()
    utility.setParam('gainDb', -6)
    const mapping = rack.mapMacro(0, utility, 'gainDb')
    expect(mapping).toMatchObject({ macro: 0, device: utility, param: 'gainDb', min: -60, max: 12 })
    expect(rack.getParam('macro1')).toBeCloseTo(54 / 72, 12)
    expect(utility.getParam('gainDb')).toBeCloseTo(-6, 9)
    expect(rack.macroMappings(0)).toEqual([mapping])
    expect(rack.macroMappings()).toEqual([mapping])
    expect(rack.macroMappings(1)).toEqual([])
  })

  it('moves every mapped param through curve and taper when the macro moves', () => {
    const { rack, utility, filter } = withDevices()
    const gain = rack.mapMacro(0, utility, 'gainDb', { min: -24, max: 6, curve: 'exponential' })
    const freq = rack.mapMacro(0, filter, 'frequency')
    expect(filter.getParam('frequency')).toBe(macroMappedValue(freq, rack.getParam('macro1')))

    rack.setParam('macro1', 0.5)
    expect(utility.getParam('gainDb')).toBe(-24 + 30 * 0.25)
    expect(utility.getParam('gainDb')).toBe(macroMappedValue(gain, 0.5))
    expect(filter.getParam('frequency')).toBeCloseTo(
      Math.sqrt(filter.params.frequency.min * filter.params.frequency.max),
      6,
    )
    rack.setParam('macro1', 1)
    expect(utility.getParam('gainDb')).toBe(6)
    expect(filter.getParam('frequency')).toBe(filter.params.frequency.max)
    rack.macros[0].set(0)
    expect(utility.getParam('gainDb')).toBe(-24)
    expect(filter.getParam('frequency')).toBe(filter.params.frequency.min)
  })

  it('re-mapping a param replaces the old mapping; unmapping leaves the param where it is', () => {
    const { rack, utility } = withDevices()
    const first = rack.mapMacro(0, utility, 'gainDb')
    const second = rack.mapMacro(1, utility, 'gainDb', { min: -12, max: 0 })
    expect(rack.macroMappings()).toEqual([second])
    expect(rack.macroMappings(0)).toEqual([])
    expect(rack.unmapMacro(first)).toBe(false)

    rack.setParam('macro2', 0.5)
    expect(utility.getParam('gainDb')).toBe(-6)
    expect(rack.unmapMacro(second)).toBe(true)
    rack.setParam('macro2', 1)
    expect(utility.getParam('gainDb')).toBe(-6)
  })

  it('only maps onto devices inside the rack and onto real params and macros', () => {
    const { rack, ctx, utility } = withDevices()
    const outside = createUtility(ctx)
    expect(() => rack.mapMacro(0, outside, 'gainDb')).toThrow(/inside rack/)
    expect(() => rack.mapMacro(0, utility, 'nope')).toThrow(/no parameter "nope"/)
    expect(() => rack.mapMacro(8, utility, 'gainDb')).toThrow(/no macro 8/)
    expect(() => rack.macro(-1)).toThrow(/no macro -1/)
    expect(rack.macro(7)).toBe(rack.macros[7])
  })

  it('drops mappings with their chain and can record a mapping without applying it', () => {
    const { rack, chain, utility, filter } = withDevices()
    rack.mapMacro(0, utility, 'gainDb')
    filter.setParam('frequency', 440)
    rack.setParam('macro2', 0.9)
    rack.mapMacro(1, filter, 'frequency', { apply: false })
    expect(filter.getParam('frequency')).toBe(440)
    expect(rack.getParam('macro2')).toBe(0.9)
    expect(rack.macroMappings()).toHaveLength(2)
    rack.removeChain(chain)
    expect(rack.macroMappings()).toEqual([])
  })

  it('reaches a nested rack through its macros, and nests arbitrarily', () => {
    const { rack, ctx, chain } = withDevices()
    const inner = createRack(ctx, { name: 'inner' })
    const innerChain = inner.addChain()
    const compressor = createCompressor(ctx)
    innerChain.addInsert(compressor)
    chain.addInsert(inner)
    inner.mapMacro(0, compressor, 'threshold', { min: -40, max: -10 })
    inner.macros[0].name = 'Squash'
    rack.mapMacro(2, inner, 'macro1')

    rack.setParam('macro3', 0.5)
    expect(inner.getParam('macro1')).toBe(0.5)
    expect(compressor.getParam('threshold')).toBe(-25)
    expect(() => rack.mapMacro(0, compressor, 'threshold')).toThrow(/inside rack/)
  })

  it('is driven by the ModMatrix as a device param target — a lane or an LFO on a macro', () => {
    const { rack, utility } = withDevices()
    rack.mapMacro(0, utility, 'gainDb', { min: -60, max: 0 })
    const matrix = new ModMatrix()
    const target = rack.macroTarget(0, { base: 0 })
    expect(target.min).toBe(0)
    expect(target.max).toBe(1)
    matrix.map(new Macro(1), target, 0.5)
    matrix.update({ playheadSec: 0, contextTimeSec: 0 })
    expect(rack.getParam('macro1')).toBe(0.5)
    expect(utility.getParam('gainDb')).toBe(-30)
    expect(() => rack.macroTarget(9)).toThrow(/no macro 9/)
  })

  it('is itself a ModSource other routes can read', () => {
    const { rack } = withDevices()
    rack.setParam('macro5', 0.7)
    expect(rack.macros[4].valueAtTime(1234)).toBe(0.7)
  })

  it('announces macro, mix and bypass changes as an ObservableDevice, whichever path moved them', () => {
    const { rack, utility } = withDevices()
    expect(isObservableDevice(rack)).toBe(true)
    const seen: unknown[] = []
    const unsubscribe = rack.onChange((change) => seen.push(change))
    rack.mapMacro(0, utility, 'gainDb', { apply: false })

    rack.setParam('macro1', 0.25)
    rack.macros[0].set(0.5)
    rack.setParam('macro1', 0.5)
    rack.setParam('mix', 0.4)
    rack.bypass = true
    rack.bypass = true
    expect(seen).toEqual([
      { type: 'param', name: 'macro1', value: 0.25 },
      { type: 'param', name: 'macro1', value: 0.5 },
      { type: 'param', name: 'macro1', value: 0.5 },
      { type: 'param', name: 'mix', value: 0.4 },
      { type: 'bypass', bypass: true },
    ])
    expect(utility.getParam('gainDb')).toBe(-24)

    unsubscribe()
    rack.setParam('macro2', 1)
    expect(seen).toHaveLength(5)
  })
})

describe('Rack delay compensation', () => {
  it('aligns every chain to the longest with sample-exact delays, and reports the longest as its latency', () => {
    const { mock, ctx, rack } = make({ currentTime: 4 })
    const a = rack.addChain({ name: 'A' })
    const b = rack.addChain({ name: 'B' })
    const compressor = createCompressor(ctx)
    a.addInsert(compressor)
    expect(compressor.latencySamples).toBe(288)
    expect(a.latencySamples).toBe(288)
    expect(a.compensationSamples).toBe(0)
    expect(b.latencySamples).toBe(0)
    expect(b.compensationSamples).toBe(288)
    expect(rack.latencySamples).toBe(288)
    expect(rack.latencySec).toBe(0.006)
    expect(delayEvents(mock, 0)).toEqual([])
    expect(delayEvents(mock, 1)).toEqual([{ method: 'setValueAtTime', args: [288 / SR, 4] }])

    const limiterLike = fakeDevice(mock, 'limiter', 77)
    b.addInsert(limiterLike)
    expect(b.latencySamples).toBe(77)
    expect(b.compensationSamples).toBe(211)
    expect(delayEvents(mock, 1).at(-1)?.args).toEqual([211 / SR, 4])
    expect(a.compensationSamples).toBe(0)

    a.removeInsert(compressor)
    expect(rack.latencySamples).toBe(77)
    expect(a.compensationSamples).toBe(77)
    expect(b.compensationSamples).toBe(0)
    expect(delayEvents(mock, 0)).toEqual([{ method: 'setValueAtTime', args: [77 / SR, 4] }])
    expect(delayEvents(mock, 1).at(-1)?.args).toEqual([0, 4])

    rack.addChain({ name: 'C' })
    expect(rack.chains[2].compensationSamples).toBe(77)
    expect(delayEvents(mock, 2)).toEqual([{ method: 'setValueAtTime', args: [77 / SR, 4] }])
  })

  it('counts bypassed devices so toggling bypass never moves a delay line', () => {
    const { ctx, rack } = make()
    const a = rack.addChain()
    const b = rack.addChain()
    const compressor = createCompressor(ctx)
    a.addInsert(compressor)
    compressor.bypass = true
    expect(b.compensationSamples).toBe(288)
    expect(rack.latencySamples).toBe(288)
  })

  it('propagates a nested rack’s latency change to the outer rack', () => {
    const { mock, ctx, rack } = make()
    const outerA = rack.addChain()
    const outerB = rack.addChain()
    const inner = createRack(ctx)
    const innerChain = inner.addChain()
    outerA.addInsert(inner)
    expect(rack.latencySamples).toBe(0)

    innerChain.addInsert(fakeDevice(mock, 'late', 100))
    expect(inner.latencySamples).toBe(100)
    expect(outerA.latencySamples).toBe(100)
    expect(outerB.compensationSamples).toBe(100)

    const innerB = inner.addChain()
    expect(innerB.compensationSamples).toBe(100)
    innerB.addInsert(fakeDevice(mock, 'later', 250))
    expect(inner.latencySamples).toBe(250)
    expect(innerChain.compensationSamples).toBe(150)
    expect(outerB.compensationSamples).toBe(250)

    outerA.removeInsert(inner)
    expect(outerB.compensationSamples).toBe(0)
    inner.addChain().addInsert(fakeDevice(mock, 'latest', 999))
    expect(outerB.compensationSamples).toBe(0)
  })

  it('clamps compensation to the delay line and still reports the true latency', () => {
    const { mock, rack } = make()
    const a = rack.addChain()
    const b = rack.addChain()
    a.addInsert(fakeDevice(mock, 'huge', 2 * SR))
    expect(rack.latencySamples).toBe(2 * SR)
    expect(b.maxCompensationSamples).toBe(PDC_MAX_DELAY_SECONDS * SR)
    expect(b.compensationSamples).toBe(PDC_MAX_DELAY_SECONDS * SR)
    expect(delayEvents(mock, 1).at(-1)?.args).toEqual([PDC_MAX_DELAY_SECONDS, 1])
  })
})

describe('Rack presets', () => {
  function buildInstrument(mock: MockAudioContext) {
    const ctx = asAudioContext(mock)
    const rack = createRack(ctx, { name: 'Space' })
    const dryChain = rack.addChain({ name: 'Dry', gain: 0.8, pan: -0.2 })
    const utility = createUtility(ctx, { params: { gainDb: -3 } })
    dryChain.addInsert(utility)
    const wetChain = rack.addChain({
      name: 'Wet',
      mute: true,
      keyZone: { low: 0, high: 60 },
      selectorZone: { low: 64, high: 127 },
    })
    const filter = createFilter(ctx, { params: { frequency: 800 } })
    wetChain.addInsert(filter)
    const inner = createRack(ctx, { name: 'Squash' })
    const compressor = createCompressor(ctx)
    inner.addChain({ name: 'Comp' }).addInsert(compressor)
    compressor.bypass = true
    inner.mapMacro(0, compressor, 'threshold', { min: -40, max: -10, curve: 's-curve' })
    inner.macros[0].name = 'Amount'
    wetChain.addInsert(inner)

    rack.mapMacro(0, utility, 'gainDb', { min: -24, max: 6, curve: 'exponential' })
    rack.mapMacro(0, filter, 'frequency', { curve: 'logarithmic' })
    rack.mapMacro(1, inner, 'macro1')
    rack.macros[0].name = 'Tone'
    rack.macros[1].name = 'Squash'
    rack.setParam('macro1', 0.35)
    rack.setParam('macro2', 0.6)
    rack.setParam('mix', 0.75)
    return { rack, utility, filter, inner, compressor }
  }

  it('captures the whole rack, round-trips through JSON and rebuilds through the registry', async () => {
    const mock = createMockContext({ sampleRate: SR })
    const { rack, utility, filter, compressor } = buildInstrument(mock)
    const preset = captureRackPreset(rack, 'Tonight', { registry: devices })

    expect(preset.name).toBe('Tonight')
    expect(preset.mix).toBe(0.75)
    expect(preset.macros).toHaveLength(8)
    expect(preset.macros[0]).toEqual({
      name: 'Tone',
      value: 0.35,
      mappings: [
        { chain: 0, device: 0, param: 'gainDb', min: -24, max: 6, curve: 'exponential' },
        { chain: 1, device: 0, param: 'frequency', min: 20, max: 20000, curve: 'logarithmic' },
      ],
    })
    expect(preset.macros[1].mappings).toEqual([
      { chain: 1, device: 1, param: 'macro1', min: 0, max: 1, curve: 'linear' },
    ])
    expect(preset.chains.map((chain) => chain.name)).toEqual(['Dry', 'Wet'])
    expect(preset.chains[0]).toMatchObject({ gain: 0.8, pan: -0.2, mute: false })
    expect(preset.chains[0].keyZone).toBeUndefined()
    expect(preset.chains[1]).toMatchObject({
      mute: true,
      keyZone: { low: 0, high: 60 },
      selectorZone: { low: 64, high: 127 },
    })
    expect(preset.chains[0].devices[0].preset).toEqual({
      name: 'utility',
      deviceId: 'utility',
      deviceVersion: devices.describe('utility').version,
      params: capturePreset(utility, 'utility').params,
    })
    const nested = preset.chains[1].devices[1]
    expect(nested.preset.deviceId).toBe('rack')
    expect(nested.preset.params.macro1).toBe(0.6)
    expect(nested.rack?.name).toBe('Squash')
    expect(nested.rack?.chains[0].devices[0]).toMatchObject({
      bypass: true,
      preset: { deviceId: 'compressor', params: capturePreset(compressor, 'x').params },
    })
    expect(nested.rack?.macros[0]).toMatchObject({
      name: 'Amount',
      value: 0.6,
      mappings: [{ chain: 0, device: 0, param: 'threshold', min: -40, max: -10, curve: 's-curve' }],
    })

    const json = serializeRackPreset(preset)
    const parsed = parseRackPreset(json)
    expect(parsed).toEqual(preset)
    expect(parseRackPreset(JSON.parse(json))).toEqual(preset)

    const mock2 = createMockContext({ sampleRate: SR })
    const rebuilt = await createRackFromPreset(asAudioContext(mock2), parsed, { registry: devices })
    expect(rebuilt.name).toBe('Tonight')
    expect(rebuilt.chains.map((chain) => chain.name)).toEqual(['Dry', 'Wet'])
    expect(rebuilt.chains[1].mute).toBe(true)
    expect(rebuilt.chains[1].keyZone).toEqual({ low: 0, high: 60 })
    expect(rebuilt.devices.map((device) => device.id)).toEqual(['utility', 'filter', 'rack'])
    expect(rebuilt.macros[0].name).toBe('Tone')
    expect(rebuilt.getParam('macro1')).toBe(0.35)
    expect(rebuilt.getParam('mix')).toBe(0.75)
    expect(rebuilt.devices[0].getParam('gainDb')).toBe(utility.getParam('gainDb'))
    expect(rebuilt.devices[1].getParam('frequency')).toBe(filter.getParam('frequency'))
    const rebuiltInner = rebuilt.devices[2] as Rack
    expect(rebuiltInner.macros[0].name).toBe('Amount')
    expect(rebuiltInner.devices[0].bypass).toBe(true)
    expect(rebuiltInner.devices[0].getParam('threshold')).toBe(compressor.getParam('threshold'))
    expect(rebuilt.latencySamples).toBe(rack.latencySamples)
    expect(rebuilt.chains[0].compensationSamples).toBe(288)
    expect(captureRackPreset(rebuilt, 'Tonight', { registry: devices })).toEqual(preset)

    // The rebuilt macros drive the rebuilt devices.
    rebuilt.setParam('macro2', 1)
    expect(rebuiltInner.getParam('macro1')).toBe(1)
    expect(rebuiltInner.devices[0].getParam('threshold')).toBe(-10)
  })

  it('hands factory options to the registry per device id', async () => {
    const mock = createMockContext({ sampleRate: SR })
    const registry = new DeviceRegistry([UTILITY_DESCRIPTOR, RACK_DESCRIPTOR])
    const create = vi.spyOn(registry, 'create')
    const preset: RackPreset = {
      name: 'One',
      mix: 1,
      macros: [{ name: 'Macro 1', value: 0, mappings: [] }],
      chains: [
        {
          name: 'Only',
          gain: 1,
          pan: 0,
          mute: false,
          devices: [
            {
              preset: { name: 'u', deviceId: 'utility', deviceVersion: 1, params: { gainDb: -6 } },
              bypass: false,
            },
          ],
        },
      ],
    }
    const rack = await createRackFromPreset(asAudioContext(mock), preset, {
      registry,
      deviceOptions: (id) => ({ extra: id.toUpperCase() }),
    })
    expect(create).toHaveBeenCalledTimes(1)
    expect(create.mock.calls[0][0]).toBe('utility')
    expect(create.mock.calls[0][2]).toEqual({
      extra: 'UTILITY',
      preset: preset.chains[0].devices[0].preset,
    })
    expect(rack.macros).toHaveLength(1)
    expect(rack.devices[0].getParam('gainDb')).toBe(-6)
  })

  it('refuses malformed presets and mappings onto missing devices', async () => {
    const ctx = asAudioContext(createMockContext({ sampleRate: SR }))
    expect(() => parseRackPreset('{"format":2,"deviceId":"rack"}')).toThrow(/unsupported/)
    expect(() => parseRackPreset({ format: 1, deviceId: 'filter' })).toThrow(/unsupported/)
    expect(() =>
      parseRackPreset({ format: 1, deviceId: 'rack', name: 'x', mix: 1, macros: [], chains: 'no' }),
    ).toThrow(/malformed/)
    expect(() =>
      parseRackPreset({
        format: 1,
        deviceId: 'rack',
        name: 'x',
        mix: 1,
        macros: [
          {
            name: 'm',
            value: 0,
            mappings: [{ chain: 0, device: 0, param: 'p', min: 0, max: 1, curve: 'wobbly' }],
          },
        ],
        chains: [],
      }),
    ).toThrow(/malformed/)
    await expect(
      createRackFromPreset(
        ctx,
        {
          name: 'x',
          mix: 1,
          macros: [
            {
              name: 'm',
              value: 0,
              mappings: [{ chain: 0, device: 3, param: 'gainDb', min: 0, max: 1, curve: 'linear' }],
            },
          ],
          chains: [{ name: 'c', gain: 1, pan: 0, mute: false, devices: [] }],
        },
        { registry: devices },
      ),
    ).rejects.toThrow(/missing device/)
  })

  it('loads and captures U23 presets of the macros and mix through the registry', async () => {
    const ctx = asAudioContext(createMockContext({ sampleRate: SR }))
    const centred = await devices.create('rack', ctx, { preset: 'Centred' })
    for (let index = 0; index < 8; index += 1)
      expect(centred.getParam(`macro${index + 1}`)).toBe(0.5)
    expect(centred.getParam('mix')).toBe(1)

    centred.setParam('macro3', 0.9)
    const snapshot = devices.capturePreset(centred, 'Snap')
    expect(snapshot).toMatchObject({ deviceId: 'rack', deviceVersion: 1 })
    const fresh = await devices.create('rack', ctx, { params: { mix: 0.2 } })
    const result = applyPreset(fresh, snapshot)
    expect(result.skipped).toEqual([])
    expect(fresh.getParam('macro3')).toBe(0.9)
    expect(fresh.getParam('mix')).toBe(1)
  })
})
