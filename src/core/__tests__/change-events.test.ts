// The additive change events U24's hooks subscribe to: every core object a
// view reads announces the edits that change what it would draw, and nothing
// else. Subscriptions return their unsubscribe.

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { WasmDevice, defineWasmDevice } from '../../dsp/WasmDevice'
import {
  asAudioContext,
  asAudioNode,
  createMockContext,
  type MockAudioContext,
} from '../../testing'
import { audioParamTarget, ModMatrix } from '../automation/ModMatrix'
import { Lfo } from '../automation/Modulator'
import { ParamLane } from '../automation/ParamLane'
import { type Device, type DeviceChange, isObservableDevice } from '../devices/Device'
import { ConvolverReverb } from '../devices/native/ConvolverReverb'
import { createEq3 } from '../devices/native/Eq3'
import { WorkletDucker } from '../devices/native/WorkletDucker'
import { createEngine } from '../Engine'
import { Emitter } from '../events'
import { EngineStats } from '../stats'
import { type StripChangeKind } from '../tracks/ChannelStrip'
import { ClipList } from '../tracks/ClipList'
import { SampleStore } from '../tracks/SampleStore'

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

function inertEngine(ctx: MockAudioContext) {
  return createEngine({
    context: asAudioContext(ctx),
    setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
    clearIntervalFn: () => {},
  })
}

describe('Emitter', () => {
  it('subscribes, emits to a copy of the set, and unsubscribes idempotently', () => {
    const emitter = new Emitter<number>()
    const seen: number[] = []
    const off = emitter.subscribe((value) => {
      seen.push(value)
      off()
    })
    emitter.subscribe((value) => seen.push(value * 10))
    emitter.emit(1)
    emitter.emit(2)
    off()
    expect(seen).toEqual([1, 10, 20])
    expect(emitter.size).toBe(1)
    emitter.clear()
    expect(emitter.size).toBe(0)
  })
})

describe('ChannelStrip.onChange', () => {
  it('announces every mixer-visible change with its kind', () => {
    const ctx = createMockContext()
    const engine = inertEngine(ctx)
    const pad = engine.addAudioTrack('pad')
    const lead = engine.addAudioTrack('lead')
    const kinds: StripChangeKind[] = []
    const off = pad.strip.onChange((change) => {
      expect(change.strip).toBe(pad.strip)
      kinds.push(change.kind)
    })

    pad.strip.setLevel(0.5)
    pad.strip.setPan(0.1)
    pad.strip.setInputGain(0.9)
    pad.strip.mute = true
    pad.strip.mute = true // no change, no event
    pad.strip.solo = true
    pad.strip.soloSafe = true
    lead.strip.solo = true // pad is soloed itself: gate stays open, no event
    pad.strip.solo = false // pad is solo-safe: still open
    pad.strip.soloSafe = false // now lead's solo closes pad's gate
    const device = fakeDevice(ctx, 'fx')
    pad.strip.addInsert(device)
    pad.strip.removeInsert(device)
    expect(kinds).toEqual([
      'level',
      'pan',
      'inputGain',
      'mute',
      'solo',
      'soloSafe',
      'solo',
      'gate',
      'soloSafe',
      'inserts',
      'inserts',
    ])

    off()
    pad.strip.setLevel(0.2)
    expect(kinds).toHaveLength(11)
  })

  it('announces routing on the mover and membership on both groups', () => {
    const ctx = createMockContext()
    const engine = inertEngine(ctx)
    const kick = engine.addAudioTrack('kick')
    const drums = engine.addGroup('drums')
    const perc = engine.addGroup('perc')
    const log: string[] = []
    kick.strip.onChange((change) => log.push(`kick:${change.kind}`))
    drums.strip.onChange((change) => log.push(`drums:${change.kind}`))
    perc.strip.onChange((change) => log.push(`perc:${change.kind}`))

    drums.add(kick)
    expect(log).toEqual(['kick:routing', 'drums:members'])
    log.length = 0
    perc.add(kick)
    expect(log).toEqual(['kick:routing', 'drums:members', 'perc:members'])
    log.length = 0
    kick.strip.connectTo(engine.master)
    expect(log).toEqual(['kick:routing', 'perc:members'])
    log.length = 0
    kick.strip.connectTo(engine.master) // same parent (none): routing only
    expect(log).toEqual(['kick:routing'])
  })

  it('announces dispose to the strip and membership to its parent, then drops listeners', () => {
    const ctx = createMockContext()
    const engine = inertEngine(ctx)
    const kick = engine.addAudioTrack('kick')
    const drums = engine.addGroup('drums', { members: [kick] })
    const log: string[] = []
    kick.strip.onChange((change) => log.push(`kick:${change.kind}`))
    drums.strip.onChange((change) => log.push(`drums:${change.kind}`))
    engine.removeTrack('kick')
    expect(log).toEqual(['kick:dispose', 'drums:members'])
  })
})

describe('ClipList.subscribe', () => {
  it('runs the owner first, then listeners with the sorted list, on every mutation', () => {
    const order: string[] = []
    const list = new ClipList(() => order.push('owner'))
    const off = list.subscribe((clips) =>
      order.push(`listener:${clips.map((c) => c.id).join(',')}`),
    )
    const clip = (id: string, startSec: number) => ({
      id,
      sourceId: id,
      startSec,
      offsetSec: 0,
      durationSec: 1,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear' as const,
      gainDb: 0,
    })
    list.add(clip('b', 2))
    list.add(clip('a', 1))
    list.update('a', { startSec: 3 })
    list.remove('b')
    list.remove('b') // miss: nothing
    list.set([clip('c', 0)])
    list.replaceFrom(0, [clip('d', 5)])
    list.clear()
    list.clear() // already empty: nothing
    expect(order).toEqual([
      'owner',
      'listener:b',
      'owner',
      'listener:a,b',
      'owner',
      'listener:b,a',
      'owner',
      'listener:a',
      'owner',
      'listener:c',
      'owner',
      'listener:d',
      'owner',
      'listener:',
    ])
    off()
    list.add(clip('e', 0))
    expect(order).toHaveLength(15)
  })
})

describe('ParamLane.onChange', () => {
  it('fires once per version bump', () => {
    const lane = new ParamLane()
    const versions: number[] = []
    const off = lane.onChange((changed) => versions.push(changed.version))
    lane.add({ timeSec: 0, value: 1 })
    lane.remove(99) // miss
    lane.remove(0)
    lane.replace([{ timeSec: 1, value: 0 }])
    lane.clear()
    expect(versions).toEqual([1, 2, 3, 4])
    off()
    lane.add({ timeSec: 0, value: 1 })
    expect(versions).toHaveLength(4)
  })
})

describe('ModMatrix.onChange and setRoute', () => {
  it('fires for map, setRoute, unmap, attach, detach — not for no-ops', () => {
    const ctx = createMockContext()
    const matrix = new ModMatrix()
    const target = audioParamTarget(ctx.createGain().gain, { min: 0, max: 1, base: 0.5 })
    const other = audioParamTarget(ctx.createGain().gain, { min: 0, max: 1, base: 0.5 })
    const listener = vi.fn()
    matrix.onChange(listener)
    const route = matrix.map(new Lfo({ rateHz: 1 }), target, 0.5)
    matrix.setRoute(route, { depth: 2, polarity: 'bipolar' })
    expect(route).toMatchObject({ depth: 1, polarity: 'bipolar' })
    matrix.unmap(route)
    matrix.unmap(route) // already gone
    matrix.attach(target) // still attached from map: no-op
    matrix.attach(other)
    matrix.detach(target)
    matrix.detach(target) // already gone
    expect(listener).toHaveBeenCalledTimes(5)
    expect(matrix.targets.has(other)).toBe(true)
    expect(() => matrix.setRoute(route, { depth: 0 })).toThrow(/not in this matrix/)
  })
})

describe('SampleStore.onChange', () => {
  it('fires for loads, pins, holds, budget, evictions, forget and clear', async () => {
    const ctx = createMockContext({ sampleRate: 1000 })
    const store = new SampleStore(asAudioContext(ctx))
    const listener = vi.fn()
    const off = store.onChange(listener)
    await store.load('a', new ArrayBuffer(1)) // 1 s stereo = 8000 bytes
    expect(listener).toHaveBeenCalledTimes(1)
    store.pin('a')
    store.pin('a') // no-op
    store.unpin('a')
    store.unpin('a') // no-op
    expect(listener).toHaveBeenCalledTimes(3)
    const release = store.retain('a')
    release()
    release() // idempotent
    expect(listener).toHaveBeenCalledTimes(5)
    store.get('a') // LRU touch: not announced
    expect(listener).toHaveBeenCalledTimes(5)
    await store.load('b', new ArrayBuffer(1))
    store.budgetBytes = 10_000 // evicts `a` inside the setter: one event
    expect(store.ids()).toEqual(['b'])
    expect(listener).toHaveBeenCalledTimes(7)
    expect(store.evict()).toEqual([]) // nothing to do: silent
    expect(listener).toHaveBeenCalledTimes(7)
    store.forget('b')
    store.clear()
    expect(listener).toHaveBeenCalledTimes(9)
    off()
    store.pin('z')
    expect(listener).toHaveBeenCalledTimes(9)
  })
})

describe('EngineStats.reset', () => {
  it('notifies subscribers', () => {
    const ctx = createMockContext()
    const stats = new EngineStats(asAudioContext(ctx))
    const listener = vi.fn()
    stats.subscribe(listener)
    stats.recordGlitch(2)
    stats.reset()
    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ glitches: 0 }))
  })
})

describe('ObservableDevice', () => {
  const wasmPath = join(dirname(fileURLToPath(import.meta.url)), '../../dsp/wasm/dattorro.wasm')
  let dattorro: WebAssembly.Module
  beforeAll(async () => {
    dattorro = await WebAssembly.compile(await readFile(wasmPath))
  })

  function collect(device: Device): DeviceChange[] {
    const changes: DeviceChange[] = []
    if (!isObservableDevice(device)) throw new Error(`${device.id} is not observable`)
    device.onChange((change) => changes.push(change))
    return changes
  }

  it('NodeDevice announces clamped params and bypass, and drops listeners on dispose', () => {
    const ctx = createMockContext()
    const device = createEq3(asAudioContext(ctx))
    const changes = collect(device)
    device.setParam('lowGain', 100)
    device.bypass = true
    device.bypass = true
    expect(changes).toEqual([
      { type: 'param', name: 'lowGain', value: 15 },
      { type: 'bypass', bypass: true },
    ])
    device.dispose()
    device.setParam('lowGain', 0)
    expect(changes).toHaveLength(2)
  })

  it('ConvolverReverb announces wet and bypass', () => {
    const ctx = createMockContext()
    const device = new ConvolverReverb(asAudioContext(ctx))
    const changes = collect(device)
    device.setParam('wet', 0.3)
    device.bypass = true
    expect(changes).toEqual([
      { type: 'param', name: 'wet', value: 0.3 },
      { type: 'bypass', bypass: true },
    ])
  })

  it('WorkletDucker announces params and bypass', () => {
    const ctx = createMockContext()
    const device = new WorkletDucker(asAudioContext(ctx), {
      createNode: (_context, name, options) =>
        ctx.createWorkletNode(name, options) as unknown as AudioWorkletNode,
    })
    const changes = collect(device)
    device.setParam('depth', 0.5)
    device.bypass = true
    expect(changes).toEqual([
      { type: 'param', name: 'depth', value: 0.5 },
      { type: 'bypass', bypass: true },
    ])
  })

  it('WasmDevice announces params and bypass', async () => {
    const ctx = createMockContext()
    const definition = defineWasmDevice({
      id: 'custom',
      wasm: () => dattorro,
      params: {
        amount: { id: 0, name: 'Amount', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' },
      },
    })
    const device = await WasmDevice.create(asAudioContext(ctx), definition, {
      processorUrl: 'p',
      createNode: (_context, name, options) =>
        ctx.createWorkletNode(name, options) as unknown as AudioWorkletNode,
    })
    const changes = collect(device)
    device.setParam('amount', 2)
    device.bypass = true
    expect(changes).toEqual([
      { type: 'param', name: 'amount', value: 1 },
      { type: 'bypass', bypass: true },
    ])
  })

  it('a plain Device is not observable', () => {
    const ctx = createMockContext()
    expect(isObservableDevice(fakeDevice(ctx, 'plain'))).toBe(false)
  })
})
