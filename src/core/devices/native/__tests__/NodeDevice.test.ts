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
  // The test device reports 10 ms, so its dry path runs through a delay.
  const [dryDelay] = ctx.delays
  const dry = gainIn(dryDelay.outputs, (g) => g.outputs.has(output))
  const stage = gainIn(input.outputs)
  const wet = gainIn(ctx.gains, (g) => g !== dry && g.outputs.has(output))
  const tone = ctx.filters[0]
  return { device, input, output, stage, tone, dry, dryDelay, wet }
}

/** The same chain with the latency a test names (none, when it names none). */
function latent(latency: { latencySec?: number; latencySamples?: (sampleRate: number) => number }) {
  return defineNodeDevice({ ...TEST_DEVICE, latencySec: undefined, ...latency })
}

describe('NodeDevice', () => {
  it('ramps params over the same 5 ms the WASM host crossfades its bypass', () => {
    expect(NODE_DEVICE_RAMP_SECONDS).toBe(BYPASS_RAMP_SECONDS)
  })

  it('wires input → chain → wet → output alongside input → delay → dry → output', () => {
    const ctx = createMockContext()
    const { device, input, output, stage, tone, dry, dryDelay, wet } = build(ctx)

    expect(device.id).toBe('test-device')
    expect(device.latencySec).toBe(0.01)
    expect(input.outputs.has(stage)).toBe(true)
    expect(stage.outputs.has(tone)).toBe(true)
    expect(tone.outputs.has(wet)).toBe(true)
    expect(wet.outputs.has(output)).toBe(true)
    expect(input.outputs).toEqual(new Set([stage, dryDelay]))
    expect(dryDelay.outputs).toEqual(new Set([dry]))
    expect(dry.outputs.has(output)).toBe(true)
    expect(dry.gain.value).toBe(0)
    expect(wet.gain.value).toBe(1)
    expect(ctx.gains).toHaveLength(5)
    expect(ctx.delays).toHaveLength(1)
  })

  it('holds the dry path back by the latency it reports, so a bypass moves nothing in time', () => {
    const ctx = createMockContext()
    const { device, dryDelay } = build(ctx)
    expect(device.latencySamples).toBe(441)
    expect(dryDelay.delayTime.value).toBe(441 / 44100)
    // Set once, when the device is built: a bypass only crossfades.
    device.bypass = true
    device.bypass = false
    expect(dryDelay.delayTime.events).toEqual([])
  })

  it('delays the dry path by whole samples, the count it reports and not its seconds', () => {
    const ctx = createMockContext({ sampleRate: 44100 })
    // 6 ms is 264.6 samples; the chain says it takes 264.
    const definition = latent({
      latencySec: 0.006,
      latencySamples: (sampleRate) => Math.floor(0.006 * sampleRate),
    })
    const device = new NodeDevice(asAudioContext(ctx), definition)
    expect(device.latencySamples).toBe(264)
    expect(ctx.delays).toHaveLength(1)
    expect(ctx.delays[0].delayTime.value).toBe(264 / 44100)
  })

  it('has no delay on the dry path of a chain that takes no time', () => {
    const ctx = createMockContext()
    const device = new NodeDevice(asAudioContext(ctx), latent({}))
    const { input, output } = io(device)
    expect(device.latencySamples).toBe(0)
    expect(ctx.delays).toHaveLength(0)
    const dry = gainIn(input.outputs, (g) => g.outputs.has(output))
    expect(dry.gain.value).toBe(0)
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
    const { device, input, output, stage, tone, dry, dryDelay, wet } = build(ctx)

    device.dispose()
    device.dispose()
    const all: MockAudioNode[] = [input, output, stage, tone, dry, dryDelay, wet]
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

  it('follow keeps an outside AudioParam in step with the first one a parameter writes', () => {
    const ctx = createMockContext()
    const { device, stage } = build(ctx, { level: 0.5 })
    const outside = ctx.createGain()
    const release = device.follow('level', outside.gain as unknown as AudioParam)
    // It starts where the device's own param stands.
    expect(outside.gain.value).toBe(0.5)
    expect(outside.gain.events).toEqual([])

    device.setParam('level', 1.5)
    expect(outside.gain.events).toEqual(stage.gain.events)

    // A lane's write ahead reaches it the same way, and another parameter's does not.
    device.applyParam('level', 2, (param, value) => param.setValueAtTime(value, 7))
    expect(outside.gain.lastEvent('setValueAtTime')?.args).toEqual([2, 7])
    device.setParam('tilt', 1)
    expect(outside.gain.events).toEqual(stage.gain.events)

    release()
    const before = outside.gain.events.length
    device.setParam('level', 0)
    expect(outside.gain.events).toHaveLength(before)
    expect(() => device.follow('nope' as 'level', outside.gain as unknown as AudioParam)).toThrow(
      'no parameter "nope"',
    )
  })
})
