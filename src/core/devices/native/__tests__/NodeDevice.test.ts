import { describe, expect, it } from 'vitest'

import { BYPASS_RAMP_SECONDS } from '../../../../dsp/abi'
import {
  asAudioContext,
  createMockContext,
  type MockAudioContext,
  type MockAudioNode,
} from '../../../../testing'
import { type ParamSpec } from '../../../params'
import { NODE_DEVICE_RAMP_SECONDS, NodeDevice, defineNodeDevice } from '../NodeDevice'
import { gainIn, io } from './graph-helpers'

const TEST_PARAMS = {
  level: { id: 0, name: 'Level', min: 0, max: 2, default: 1, taper: 'linear', unit: '' },
  tilt: { id: 1, name: 'Tilt', min: -1, max: 1, default: 0, taper: 'linear', unit: '' },
} as const satisfies Record<string, ParamSpec>

/** One gain in the chain; `tilt` drives a second, disconnected-from-audio param via a custom ramp. */
const TEST_DEVICE = defineNodeDevice({
  id: 'test-device',
  params: TEST_PARAMS,
  latencySec: 0.01,
  build(context) {
    const stage = context.createGain()
    const tone = context.createBiquadFilter()
    stage.connect(tone)
    return {
      input: stage,
      output: tone,
      nodes: [stage, tone],
      apply: {
        level: (value, ramp) => ramp(stage.gain, value),
        tilt: (value, ramp) => ramp(tone.gain, value * 6, 0.05),
      },
    }
  },
})

function build(ctx: MockAudioContext, params?: Partial<Record<'level' | 'tilt', number>>) {
  const device = new NodeDevice(asAudioContext(ctx), TEST_DEVICE, { params })
  const { input, output } = io(device)
  const dry = gainIn(input.outputs, (g) => g.outputs.has(output))
  const stage = gainIn(input.outputs, (g) => g !== dry)
  const wet = gainIn(ctx.gains, (g) => g !== dry && g.outputs.has(output))
  const tone = ctx.filters[0]
  return { device, input, output, stage, tone, dry, wet }
}

describe('NodeDevice', () => {
  it('ramps params over the same 5 ms the WASM host crossfades its bypass', () => {
    expect(NODE_DEVICE_RAMP_SECONDS).toBe(BYPASS_RAMP_SECONDS)
  })

  it('wires input → chain → wet → output alongside input → dry → output', () => {
    const ctx = createMockContext()
    const { device, input, output, stage, tone, dry, wet } = build(ctx)

    expect(device.id).toBe('test-device')
    expect(device.latencySec).toBe(0.01)
    expect(input.outputs.has(stage)).toBe(true)
    expect(stage.outputs.has(tone)).toBe(true)
    expect(tone.outputs.has(wet)).toBe(true)
    expect(wet.outputs.has(output)).toBe(true)
    expect(input.outputs.has(dry)).toBe(true)
    expect(dry.outputs.has(output)).toBe(true)
    expect(dry.gain.value).toBe(0)
    expect(wet.gain.value).toBe(1)
    expect(ctx.gains).toHaveLength(5)
  })

  it('applies initial values outright (no automation events) and clamps overrides', () => {
    const ctx = createMockContext()
    const { device, stage, tone } = build(ctx, { level: 5, tilt: 0.5 })

    expect(device.getParam('level')).toBe(2)
    expect(device.getParam('tilt')).toBe(0.5)
    expect(stage.gain.value).toBe(2)
    expect(tone.gain.value).toBe(3)
    expect(stage.gain.events).toEqual([])
    expect(tone.gain.events).toEqual([])
  })

  it('schedules setParam as hold-now + linear ramp and tracks the clamped value', () => {
    const ctx = createMockContext({ currentTime: 2 })
    const { device, stage } = build(ctx)

    device.setParam('level', 0.25)
    expect(device.getParam('level')).toBe(0.25)
    expect(stage.gain.events).toEqual([
      { method: 'cancelAndHoldAtTime', args: [2] },
      { method: 'linearRampToValueAtTime', args: [0.25, 2 + NODE_DEVICE_RAMP_SECONDS] },
    ])

    device.setParam('level', -3)
    expect(device.getParam('level')).toBe(0)
    expect(stage.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([
      0,
      2 + NODE_DEVICE_RAMP_SECONDS,
    ])

    device.setParam('level', Number.NaN)
    expect(device.getParam('level')).toBe(TEST_PARAMS.level.default)
  })

  it('lets an applier choose a longer ramp', () => {
    const ctx = createMockContext({ currentTime: 1 })
    const { device, tone } = build(ctx)
    device.setParam('tilt', -1)
    expect(tone.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([-6, 1.05])
  })

  it('falls back to cancelScheduledValues + setValueAtTime without cancelAndHoldAtTime', () => {
    const ctx = createMockContext({ currentTime: 3 })
    const { device, stage } = build(ctx)
    Object.assign(stage.gain, { cancelAndHoldAtTime: undefined, value: 1.5 })

    device.setParam('level', 0.5)
    expect(stage.gain.events).toEqual([
      { method: 'cancelScheduledValues', args: [3] },
      { method: 'setValueAtTime', args: [1.5, 3] },
      { method: 'linearRampToValueAtTime', args: [0.5, 3 + NODE_DEVICE_RAMP_SECONDS] },
    ])
  })

  it('rejects unknown parameters', () => {
    const ctx = createMockContext()
    const { device } = build(ctx)
    expect(() => device.setParam('nope' as 'level', 1)).toThrow(/no parameter "nope"/)
    expect(() => device.getParam('nope' as 'level')).toThrow(/no parameter "nope"/)
  })

  it('crossfades dry and wet on bypass and back, once per change', () => {
    const ctx = createMockContext({ currentTime: 5 })
    const { device, dry, wet } = build(ctx)

    expect(device.bypass).toBe(false)
    device.bypass = true
    device.bypass = true
    expect(device.bypass).toBe(true)
    expect(dry.gain.events).toEqual([
      { method: 'cancelAndHoldAtTime', args: [5] },
      { method: 'linearRampToValueAtTime', args: [1, 5 + NODE_DEVICE_RAMP_SECONDS] },
    ])
    expect(wet.gain.events).toEqual([
      { method: 'cancelAndHoldAtTime', args: [5] },
      { method: 'linearRampToValueAtTime', args: [0, 5 + NODE_DEVICE_RAMP_SECONDS] },
    ])

    ctx.advanceClock(1)
    device.bypass = false
    expect(device.bypass).toBe(false)
    expect(dry.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([
      0,
      6 + NODE_DEVICE_RAMP_SECONDS,
    ])
    expect(wet.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([
      1,
      6 + NODE_DEVICE_RAMP_SECONDS,
    ])
    expect(dry.gain.eventsFor('linearRampToValueAtTime')).toHaveLength(2)
  })

  it('disconnects every node on dispose, exactly once, and goes quiet afterwards', () => {
    const ctx = createMockContext()
    const { device, input, output, stage, tone, dry, wet } = build(ctx)

    device.dispose()
    device.dispose()
    const all: MockAudioNode[] = [input, output, stage, tone, dry, wet]
    for (const node of all) {
      expect(node.disconnectCalls.count).toBe(1)
      expect(node.outputs.size).toBe(0)
    }

    device.setParam('level', 0.5)
    device.bypass = true
    expect(device.getParam('level')).toBe(0.5)
    expect(device.bypass).toBe(true)
    expect(stage.gain.events).toEqual([])
    expect(dry.gain.events).toEqual([])
  })
})
