import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { asAudioContext, createMockContext, type MockAudioContext } from '../../testing'
import { isMeteredDevice } from '../../core/devices/Device'
import { DEVICE_METER_HZ, type WasmDeviceProcessorOptions } from '../abi'
import { clearWasmModuleCache, compileWasm } from '../assets'
import {
  PLATE_REVERB_DEVICE,
  PLATE_REVERB_PARAMS,
  createPlateReverb,
} from '../devices/plate-reverb'
import { WasmDevice, defineWasmDevice, type WorkletNodeFactory } from '../WasmDevice'

const wasmPath = join(dirname(fileURLToPath(import.meta.url)), '../wasm/plate-reverb.wasm')
let plateModule: WebAssembly.Module

beforeAll(async () => {
  plateModule = await WebAssembly.compile(await readFile(wasmPath))
})

beforeEach(() => {
  clearWasmModuleCache()
})

const mockNodeFactory: WorkletNodeFactory = (context, name, options) =>
  (context as unknown as MockAudioContext).createWorkletNode(
    name,
    options,
  ) as unknown as AudioWorkletNode

describe('WasmDevice', () => {
  it('loads the processor once per context and builds one node per device', async () => {
    const ctx = createMockContext()
    const context = asAudioContext(ctx)
    const options = {
      wasm: plateModule,
      processorUrl: 'https://example.test/worklets/wasm-device.js',
      createNode: mockNodeFactory,
    }
    const a = await createPlateReverb(context, options)
    const b = await createPlateReverb(context, options)

    expect(ctx.audioWorklet.modules).toEqual(['https://example.test/worklets/wasm-device.js'])
    expect(ctx.workletNodes).toHaveLength(2)
    expect(a.node).not.toBe(b.node)
    expect(ctx.workletNodes[0].name).toBe('live-mix-wasm-device')
    const nodeOptions = ctx.workletNodes[0].options as AudioWorkletNodeOptions
    expect(nodeOptions.outputChannelCount).toEqual([2])
    const processorOptions = nodeOptions.processorOptions as WasmDeviceProcessorOptions
    expect(processorOptions.module).toBe(plateModule)
    expect(processorOptions.deviceId).toBe('plate-reverb')
  })

  it('tells the processor how long to hold the dry signal back: the latency it reports', async () => {
    const ctx = createMockContext({ sampleRate: 48000 })
    const options = { wasm: plateModule, processorUrl: 'p', createNode: mockNodeFactory }
    const late = await WasmDevice.create(
      asAudioContext(ctx),
      { ...PLATE_REVERB_DEVICE, latencySamples: () => 77 },
      options,
    )
    expect(late.latencySamples).toBe(77)
    const of = (index: number) =>
      (ctx.workletNodes[index].options as AudioWorkletNodeOptions)
        .processorOptions as WasmDeviceProcessorOptions
    expect(of(0).latencySamples).toBe(77)

    // In seconds alone, it is the same count the device reports.
    const inSeconds = await WasmDevice.create(
      asAudioContext(ctx),
      { ...PLATE_REVERB_DEVICE, latencySec: 0.0015 },
      options,
    )
    expect(inSeconds.latencySamples).toBe(72)
    expect(of(1).latencySamples).toBe(72)

    // A device that takes no time says nothing.
    await createPlateReverb(asAudioContext(ctx), options)
    expect(of(2).latencySamples).toBeUndefined()
  })

  it('seeds processorOptions.params with defaults and clamped overrides', async () => {
    const ctx = createMockContext()
    const device = await createPlateReverb(asAudioContext(ctx), {
      wasm: plateModule,
      processorUrl: 'p',
      createNode: mockNodeFactory,
      params: { mix: 1.7, predelayMs: 40 },
    })
    const options = ctx.workletNodes[0].options as AudioWorkletNodeOptions
    const processorOptions = options.processorOptions as WasmDeviceProcessorOptions
    expect(processorOptions.params).toEqual([
      [0, 1],
      [1, 0.7],
      [2, 0.3],
      [3, 40],
    ])
    expect(device.getParam('mix')).toBe(1)
    expect(device.getParam('decay')).toBe(PLATE_REVERB_PARAMS.decay.default)
  })

  it('posts clamped set-param messages by id and tracks values', async () => {
    const ctx = createMockContext()
    const device = await createPlateReverb(asAudioContext(ctx), {
      wasm: plateModule,
      processorUrl: 'p',
      createNode: mockNodeFactory,
    })
    device.setParam('decay', 0.9)
    device.setParam('predelayMs', 999)
    const posted = ctx.workletNodes[0].port.posted.calls.map((call) => call[0])
    expect(posted).toEqual([
      { type: 'set-param', paramId: 1, value: 0.9 },
      { type: 'set-param', paramId: 3, value: 250 },
    ])
    expect(device.getParam('predelayMs')).toBe(250)
    expect(() => device.setParam('nope' as 'mix', 1)).toThrow(/no parameter/)
  })

  it('toggles bypass over the port exactly once per change', async () => {
    const ctx = createMockContext()
    const device = await createPlateReverb(asAudioContext(ctx), {
      wasm: plateModule,
      processorUrl: 'p',
      createNode: mockNodeFactory,
    })
    device.bypass = true
    device.bypass = true
    device.bypass = false
    const posted = ctx.workletNodes[0].port.posted.calls.map((call) => call[0])
    expect(posted).toEqual([
      { type: 'bypass', enabled: true },
      { type: 'bypass', enabled: false },
    ])
    expect(device.bypass).toBe(false)
  })

  it('exposes the worklet node as input and output and disconnects on dispose', async () => {
    const ctx = createMockContext()
    const device = await createPlateReverb(asAudioContext(ctx), {
      wasm: plateModule,
      processorUrl: 'p',
      createNode: mockNodeFactory,
    })
    expect(device.input).toBe(device.node)
    expect(device.output).toBe(device.node)
    expect(device.id).toBe('plate-reverb')
    expect(device.latencySec).toBe(0)
    device.dispose()
    expect(ctx.workletNodes[0].disconnectCalls.count).toBe(1)
    // The processor is told to stop: disconnected, it would be rendered for as long as the context lives.
    expect(ctx.workletNodes[0].port.posted.calls.map((call) => call[0])).toEqual([
      { type: 'dispose' },
    ])
    device.setParam('mix', 0.1)
    expect(ctx.workletNodes[0].port.posted.count).toBe(1)
  })

  it('compiles raw bytes and caches URL-shaped sources per page', async () => {
    const bytes = await readFile(wasmPath)
    const fromBytes = await compileWasm(bytes)
    expect(fromBytes).toBeInstanceOf(WebAssembly.Module)

    let fetches = 0
    const originalFetch = globalThis.fetch
    globalThis.fetch = () => {
      fetches += 1
      return Promise.resolve(
        new Response(bytes, { headers: { 'content-type': 'application/octet-stream' } }),
      )
    }
    try {
      const [first, second] = await Promise.all([
        compileWasm('https://example.test/wasm/plate-reverb.wasm'),
        compileWasm(new URL('https://example.test/wasm/plate-reverb.wasm')),
      ])
      expect(first).toBe(second)
      expect(fetches).toBe(1)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('defineWasmDevice keeps the default wasm URL lazy', () => {
    const definition = defineWasmDevice({
      id: 'lazy',
      wasm: () => new URL('../wasm/plate-reverb.wasm', import.meta.url),
      params: PLATE_REVERB_PARAMS,
    })
    expect((definition.wasm() as URL).pathname.endsWith('/wasm/plate-reverb.wasm')).toBe(true)
    expect((PLATE_REVERB_DEVICE.wasm() as URL).pathname.endsWith('/wasm/plate-reverb.wasm')).toBe(
      true,
    )
  })

  it('WasmDevice.create works with any definition, not only stock devices', async () => {
    const ctx = createMockContext()
    const custom = defineWasmDevice({
      id: 'custom',
      wasm: () => plateModule,
      params: {
        amount: { id: 0, name: 'Amount', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' },
      },
      latencySec: 0.01,
    })
    const device = await WasmDevice.create(asAudioContext(ctx), custom, {
      processorUrl: 'p',
      createNode: mockNodeFactory,
    })
    expect(device.id).toBe('custom')
    expect(device.latencySec).toBe(0.01)
    expect(device.getParam('amount')).toBe(0.5)
  })

  it('reports seconds for a definition that only gives its latency in samples', async () => {
    const ctx = createMockContext()
    const delayed = defineWasmDevice({
      id: 'delayed',
      wasm: () => plateModule,
      params: {
        amount: { id: 0, name: 'Amount', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' },
      },
      latencySamples: () => 39,
    })
    const device = await WasmDevice.create(asAudioContext(ctx), delayed, {
      processorUrl: 'p',
      createNode: mockNodeFactory,
    })
    expect(device.latencySamples).toBe(39)
    expect(device.latencySec).toBeCloseTo(39 / ctx.sampleRate, 12)
    expect(Math.round(device.latencySec * ctx.sampleRate)).toBe(39)
  })
})

describe('WasmDevice meters', () => {
  const metered = defineWasmDevice({
    id: 'metered',
    wasm: () => plateModule,
    params: {
      amount: { id: 0, name: 'Amount', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' },
    },
    meters: {
      reduction: { id: 0, name: 'Gain reduction', unit: 'dB' },
      level: { id: 1, name: 'Level', unit: 'dB' },
    },
  })

  async function create() {
    const ctx = createMockContext()
    const device = await WasmDevice.create(asAudioContext(ctx), metered, {
      processorUrl: 'p',
      createNode: mockNodeFactory,
    })
    const port = ctx.workletNodes[0].port
    const posted = () => port.posted.calls.map((call) => call[0])
    return { ctx, device, port, posted }
  }

  it('asks the module for its meters only while someone watches, and keeps the latest', async () => {
    const { ctx, device, port, posted } = await create()
    expect(isMeteredDevice(device)).toBe(true)
    expect(device.meter('reduction')).toBe(0)
    expect(posted()).toEqual([])

    const stop = device.watchMeters()
    const intervalFrames = Math.round(ctx.sampleRate / DEVICE_METER_HZ)
    expect(posted()).toEqual([{ type: 'meters', count: 2, intervalFrames }])
    port.receive({ type: 'meters', values: [-3.5, -18] })
    expect(device.meter('reduction')).toBe(-3.5)
    expect(device.meter('level')).toBe(-18)

    stop()
    stop()
    expect(posted()).toEqual([
      { type: 'meters', count: 2, intervalFrames },
      { type: 'meters', count: 0, intervalFrames },
    ])
    // Nobody refreshes it any more, so it reads as nothing rather than as the last value.
    expect(device.meter('reduction')).toBe(0)
    port.receive({ type: 'meters', values: [-9, -9] })
    expect(device.meter('reduction')).toBe(0)
    expect(() => device.meter('nope')).toThrow(/no meter/)
  })

  it('counts watches, so one view leaving does not blind another', async () => {
    const { device, port, posted } = await create()
    const first = device.watchMeters()
    const second = device.watchMeters()
    expect(posted()).toHaveLength(1)
    first()
    port.receive({ type: 'meters', values: [-2, -20] })
    expect(device.meter('reduction')).toBe(-2)
    expect(posted()).toHaveLength(1)
    second()
    expect(posted()).toHaveLength(2)
  })

  it('leaves the port alone for a device without meters', async () => {
    const ctx = createMockContext()
    const device = await createPlateReverb(asAudioContext(ctx), {
      wasm: plateModule,
      processorUrl: 'p',
      createNode: mockNodeFactory,
    })
    expect(isMeteredDevice(device)).toBe(false)
    device.watchMeters()()
    expect(ctx.workletNodes[0].port.posted.count).toBe(0)
  })

  it('does not take the port over from an app that answers on onmessage', async () => {
    const { device, port } = await create()
    const answers: unknown[] = []
    port.onmessage = (event) => answers.push(event.data)
    const stop = device.watchMeters()
    port.receive({ type: 'meters', values: [-1, -1] })
    expect(answers).toEqual([{ type: 'meters', values: [-1, -1] }])
    expect(device.meter('reduction')).toBe(-1)
    stop()
  })
})

describe('WasmDevice notes and custom processors', () => {
  it('posts note-on/off over the port and honours a definition-level processor', async () => {
    const ctx = createMockContext()
    const custom = defineWasmDevice({
      id: 'app-synth',
      wasm: () => plateModule,
      params: {},
      processor: { name: 'app-synth-processor', url: () => 'https://app.test/synth.js' },
    })
    const device = await WasmDevice.create(asAudioContext(ctx), custom, {
      createNode: mockNodeFactory,
    })
    expect(ctx.audioWorklet.modules).toEqual(['https://app.test/synth.js'])
    expect(ctx.workletNodes[0].name).toBe('app-synth-processor')
    device.noteOn(1, 440, 0.4)
    device.noteOff(1)
    device.postMessage({ type: 'load-sample', frames: 2 })
    const posted = ctx.workletNodes[0].port.posted.calls.map((call) => call[0])
    expect(posted).toEqual([
      { type: 'note-on', noteId: 1, frequency: 440, gain: 0.4 },
      { type: 'note-off', noteId: 1 },
      { type: 'load-sample', frames: 2 },
    ])
  })

  it('hands a sample device copies of at most two channels and leaves the caller its buffers', async () => {
    const ctx = createMockContext()
    const device = await WasmDevice.create(asAudioContext(ctx), PLATE_REVERB_DEVICE, {
      wasm: plateModule,
      createNode: mockNodeFactory,
    })
    const left = Float32Array.of(0.1, 0.2, 0.3)
    const right = Float32Array.of(-0.1, -0.2, -0.3)
    device.loadSample([], 48000)
    device.loadSample([left, right, Float32Array.of(9)], 44100)
    const calls = ctx.workletNodes[0].port.posted.calls
    const samples = calls.filter((call) => (call[0] as { type: string }).type === 'sample')
    expect(samples).toHaveLength(1)
    const [message, transfer] = samples[0] as [
      { channels: Float32Array[]; sampleRate: number },
      ArrayBuffer[],
    ]
    expect(message.sampleRate).toBe(44100)
    expect(message.channels.map((channel) => [...channel])).toEqual([[...left], [...right]])
    expect(message.channels[0]).not.toBe(left)
    expect(transfer).toEqual(message.channels.map((channel) => channel.buffer))
    expect(left).toHaveLength(3)
    device.dispose()
    device.loadSample([left], 48000)
    expect(calls.filter((call) => (call[0] as { type: string }).type === 'sample')).toHaveLength(1)
  })
})
