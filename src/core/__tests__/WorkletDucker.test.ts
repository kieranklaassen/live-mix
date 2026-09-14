import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  asAudioContext,
  asAudioNode,
  configureMocks,
  createMockContext,
  type MockAudioContext,
} from '../../testing'
import { DUCK_DEPTH, ENV_ATTACK_MS, ENV_GAIN_SCALE, ENV_RELEASE_MS } from '../devices/native/Ducker'
import {
  DUCKER_PARAMS,
  DUCKER_PROCESSOR_NAME,
  type DuckerHostMessage,
  type DuckerProcessorOptions,
} from '../devices/native/ducker-abi'
import { type SidechainDucker } from '../devices/native/SidechainDucker'
import { WorkletDucker, type DuckerNodeFactory } from '../devices/native/WorkletDucker'
import { createEngine } from '../Engine'

beforeEach(() => {
  vi.useFakeTimers()
  configureMocks({ advanceTimers: vi.advanceTimersByTimeAsync })
})

afterEach(() => {
  configureMocks({})
  vi.useRealTimers()
})

function nodeFactory(ctx: MockAudioContext): DuckerNodeFactory {
  return (_context, name, options) =>
    ctx.createWorkletNode(name, options) as unknown as AudioWorkletNode
}

function setup(options: ConstructorParameters<typeof WorkletDucker>[1] = {}) {
  const ctx = createMockContext()
  const ducker = new WorkletDucker(asAudioContext(ctx), {
    createNode: nodeFactory(ctx),
    ...options,
  })
  const node = ctx.workletNodes[0]
  const posted = () => node.port.posted.calls.map((call) => call[0])
  return { ctx, ducker, node, posted }
}

describe('WorkletDucker (host)', () => {
  it('constructs one two-input node under the shared processor name with the Phase 0 defaults', () => {
    const { ctx, ducker, node } = setup()
    expect(ctx.workletNodes).toHaveLength(1)
    expect(node.name).toBe(DUCKER_PROCESSOR_NAME)
    const options = node.options as AudioWorkletNodeOptions
    expect(options.numberOfInputs).toBe(2)
    expect(options.numberOfOutputs).toBe(1)
    expect(options.outputChannelCount).toEqual([2])
    const processorOptions = options.processorOptions as DuckerProcessorOptions
    expect(processorOptions.params).toEqual([
      [DUCKER_PARAMS.depth.id, DUCK_DEPTH],
      [DUCKER_PARAMS.attackMs.id, ENV_ATTACK_MS],
      [DUCKER_PARAMS.holdMs.id, 0],
      [DUCKER_PARAMS.releaseMs.id, ENV_RELEASE_MS],
      [DUCKER_PARAMS.gainScale.id, ENV_GAIN_SCALE],
      [DUCKER_PARAMS.timeConstant.id, 0.08],
    ])
    expect(ducker.mode).toBe('worklet')
    expect(ducker.id).toBe('ducker')
    expect(ducker.depth).toBe(DUCK_DEPTH)
    expect(ducker.attackMs).toBe(ENV_ATTACK_MS)
    expect(ducker.holdMs).toBe(0)
    expect(ducker.releaseMs).toBe(ENV_RELEASE_MS)
    expect(ducker.gainScale).toBe(ENV_GAIN_SCALE)
    expect(ducker.timeConstant).toBe(0.08)
    expect(ducker.latencySec).toBe(0)
    expect(ducker.input).toBe(node)
    expect(ducker.output).toBe(node)
    // No analyser, no interval: everything lives in the processor.
    expect(ctx.analysers).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('passes clamped initial params, window size and report rate to the processor', () => {
    const { node } = setup({ depth: 2, holdMs: 120, windowSize: 512, reportHz: 0 })
    const processorOptions = (node.options as AudioWorkletNodeOptions)
      .processorOptions as DuckerProcessorOptions
    expect(processorOptions.params?.[0]).toEqual([DUCKER_PARAMS.depth.id, 1])
    expect(processorOptions.params?.[2]).toEqual([DUCKER_PARAMS.holdMs.id, 120])
    expect(processorOptions.windowSize).toBe(512)
    expect(processorOptions.reportHz).toBe(0)
  })

  it('key() connects the node into input 1; re-key and unkey disconnect the previous key', () => {
    const { ctx, ducker, node } = setup()
    const voice = ctx.createGain()
    const second = ctx.createGain()
    ducker.key(asAudioNode(voice))
    expect(voice.connectCalls.calledWith(node, 0, 1)).toBe(true)
    expect(ducker.keyNode).toBe(voice)

    ducker.key(asAudioNode(second))
    expect(voice.disconnectCalls.calledWith(node, 0, 1)).toBe(true)
    expect(second.connectCalls.calledWith(node, 0, 1)).toBe(true)
    expect(ducker.keyNode).toBe(second)

    ducker.unkey()
    expect(second.disconnectCalls.calledWith(node, 0, 1)).toBe(true)
    expect(ducker.keyNode).toBeNull()
    ducker.unkey() // idempotent
    expect(second.disconnectCalls.count).toBe(1)
  })

  it('unkey tolerates a key that was already disconnected (live input re-attach)', () => {
    const { ctx, ducker } = setup()
    const voice = ctx.createGain()
    ducker.key(asAudioNode(voice))
    voice.disconnect = () => {
      throw new DOMException('not connected', 'InvalidAccessError')
    }
    expect(() => ducker.key(asAudioNode(ctx.createGain()))).not.toThrow()
  })

  it('setParam clamps, records and posts by id; getParam reads back; unknown names throw', () => {
    const { ducker, posted } = setup()
    ducker.setParam('depth', 0.5)
    expect(ducker.getParam('depth')).toBe(0.5)
    expect(posted()).toContainEqual({
      type: 'set-param',
      paramId: DUCKER_PARAMS.depth.id,
      value: 0.5,
    })
    ducker.setParam('releaseMs', 99_999)
    expect(ducker.releaseMs).toBe(DUCKER_PARAMS.releaseMs.max)
    expect(() => ducker.setParam('nope' as 'depth', 1)).toThrow(/no parameter "nope"/)
    expect(() => ducker.getParam('constructor' as 'depth')).toThrow(/no parameter/)
  })

  it('bypass posts once per change; stop posts stop; dispose unkeys, posts dispose and closes', () => {
    const { ctx, ducker, node, posted } = setup()
    const voice = ctx.createGain()
    ducker.key(asAudioNode(voice))
    ducker.bypass = true
    ducker.bypass = true
    expect(ducker.bypass).toBe(true)
    expect(posted().filter((m) => (m as { type: string }).type === 'bypass')).toEqual([
      { type: 'bypass', enabled: true },
    ])
    ducker.stop()
    expect(posted()).toContainEqual({ type: 'stop' })

    const close = vi.spyOn(node.port, 'close')
    ducker.dispose()
    expect(voice.disconnectCalls.calledWith(node, 0, 1)).toBe(true)
    expect(posted()).toContainEqual({ type: 'dispose' })
    expect(node.disconnectCalls.count).toBe(1)
    expect(close).toHaveBeenCalledTimes(1)

    // After dispose: no more messages, key() refuses, dispose is idempotent.
    const before = posted().length
    ducker.setParam('depth', 0.1)
    ducker.dispose()
    expect(posted()).toHaveLength(before)
    expect(() => ducker.key(asAudioNode(voice))).toThrow(/disposed/)
  })

  it('mirrors envelope and gain reports from the processor', () => {
    const { ducker, node } = setup()
    expect(ducker.envelope).toBe(0)
    expect(ducker.gain).toBe(1)
    node.port.receive({ type: 'ready', windowSize: 256 } satisfies DuckerHostMessage)
    node.port.receive({ type: 'envelope', envelope: 0.4, gain: 0.35 } satisfies DuckerHostMessage)
    expect(ducker.envelope).toBe(0.4)
    expect(ducker.gain).toBe(0.35)
    expect(() => node.port.receive({ type: 'nope' })).toThrow(/unhandled ducker host message/)
  })

  it('explains an unregistered processor instead of surfacing InvalidStateError', () => {
    const ctx = createMockContext()
    const createNode: DuckerNodeFactory = () => {
      throw new DOMException('processor not defined', 'InvalidStateError')
    }
    expect(() => new WorkletDucker(asAudioContext(ctx), { createNode })).toThrow(
      /loadDuckerProcessor/,
    )
    const other: DuckerNodeFactory = () => {
      throw new TypeError('boom')
    }
    expect(() => new WorkletDucker(asAudioContext(ctx), { createNode: other })).toThrow(TypeError)
  })
})

describe('engine.addDucker mode flag', () => {
  it('defaults to the legacy poll (node order and timers unchanged)', () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    const music = engine.addBus('music')
    const ducker = engine.addDucker(music)
    expect(ducker.mode).toBe('legacy')
    expect(ctx.workletNodes).toHaveLength(0)
    ducker.key(asAudioNode(ctx.createGain()))
    expect(ctx.analysers).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(1)
    expect(music.inserts).toHaveLength(0)
    engine.dispose()
  })

  it('mode worklet inserts a WorkletDucker post-fader into the bus and manages its lifecycle', () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    const music = engine.addBus('music')
    const ducker = engine.addDucker(music, { mode: 'worklet', createNode: nodeFactory(ctx) })
    expect(ducker).toBeInstanceOf(WorkletDucker)
    expect(ducker.mode).toBe('worklet')
    const node = ctx.workletNodes[0]
    expect(music.inserts).toEqual([ducker])
    // gain → worklet → master.
    expect(ctx.gains[1].connectCalls.calledWith(node)).toBe(true)
    expect(node.connectCalls.calledWith(engine.master.gainNode)).toBe(true)
    expect(music.output).toBe(node)

    const voice = engine.addLiveInputTrack('voice')
    voice.onAttach((source) => ducker.key(source))
    const source = ctx.createGain()
    voice.attach(asAudioNode(source))
    expect(source.connectCalls.calledWith(node, 0, 1)).toBe(true)
    // The voice's audible path never runs through the ducked bus.
    expect(source.connectCalls.calledWith(music.gainNode)).toBe(false)
    expect(ctx.analysers).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)

    const posted = () => node.port.posted.calls.map((call) => call[0])
    engine.stop()
    expect(posted()).toContainEqual({ type: 'stop' })
    engine.dispose()
    expect(posted()).toContainEqual({ type: 'dispose' })
  })

  it('worklet mode needs a Bus target', () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    const param = ctx.createGain().gain as unknown as AudioParam
    expect(() =>
      engine.addDucker(param as unknown as never, {
        mode: 'worklet',
        createNode: nodeFactory(ctx),
      }),
    ).toThrow(/Bus target/)
  })

  it('both implementations satisfy the SidechainDucker contract used by the engine', () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    const duckers: SidechainDucker[] = [
      engine.addDucker(engine.addBus('a')),
      engine.addDucker(engine.addBus('b'), { mode: 'worklet', createNode: nodeFactory(ctx) }),
    ]
    for (const ducker of duckers) {
      expect(ducker.depth).toBe(DUCK_DEPTH)
      expect(ducker.attackMs).toBe(ENV_ATTACK_MS)
      expect(ducker.releaseMs).toBe(ENV_RELEASE_MS)
      expect(ducker.gainScale).toBe(ENV_GAIN_SCALE)
      expect(ducker.envelope).toBe(0)
      ducker.key(asAudioNode(ctx.createGain()))
      ducker.unkey()
      ducker.stop()
      ducker.dispose()
    }
    expect(ctx.workletNodes[0].disconnectCalls.count).toBe(1)
  })
})
