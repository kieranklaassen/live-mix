import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { asAudioContext, createMockContext, type MockAudioContext } from '../../testing'
import { type WasmDeviceProcessorOptions } from '../abi'
import { clearWasmModuleCache, compileWasm } from '../assets'
import { DATTORRO_DEVICE, DATTORRO_PARAMS, createDattorroReverb } from '../devices/dattorro'
import { WasmDevice, defineWasmDevice, type WorkletNodeFactory } from '../WasmDevice'

const wasmPath = join(dirname(fileURLToPath(import.meta.url)), '../wasm/dattorro.wasm')
let dattorroModule: WebAssembly.Module

beforeAll(async () => {
  dattorroModule = await WebAssembly.compile(await readFile(wasmPath))
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
      wasm: dattorroModule,
      processorUrl: 'https://example.test/worklets/wasm-device.js',
      createNode: mockNodeFactory,
    }
    const a = await createDattorroReverb(context, options)
    const b = await createDattorroReverb(context, options)

    expect(ctx.audioWorklet.modules).toEqual(['https://example.test/worklets/wasm-device.js'])
    expect(ctx.workletNodes).toHaveLength(2)
    expect(a.node).not.toBe(b.node)
    expect(ctx.workletNodes[0].name).toBe('live-mix-wasm-device')
    const nodeOptions = ctx.workletNodes[0].options as AudioWorkletNodeOptions
    expect(nodeOptions.outputChannelCount).toEqual([2])
    const processorOptions = nodeOptions.processorOptions as WasmDeviceProcessorOptions
    expect(processorOptions.module).toBe(dattorroModule)
    expect(processorOptions.deviceId).toBe('dattorro')
  })

  it('seeds processorOptions.params with defaults and clamped overrides', async () => {
    const ctx = createMockContext()
    const device = await createDattorroReverb(asAudioContext(ctx), {
      wasm: dattorroModule,
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
    expect(device.getParam('decay')).toBe(DATTORRO_PARAMS.decay.default)
  })

  it('posts clamped set-param messages by id and tracks values', async () => {
    const ctx = createMockContext()
    const device = await createDattorroReverb(asAudioContext(ctx), {
      wasm: dattorroModule,
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
    const device = await createDattorroReverb(asAudioContext(ctx), {
      wasm: dattorroModule,
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
    const device = await createDattorroReverb(asAudioContext(ctx), {
      wasm: dattorroModule,
      processorUrl: 'p',
      createNode: mockNodeFactory,
    })
    expect(device.input).toBe(device.node)
    expect(device.output).toBe(device.node)
    expect(device.id).toBe('dattorro')
    expect(device.latencySec).toBe(0)
    device.dispose()
    expect(ctx.workletNodes[0].disconnectCalls.count).toBe(1)
    device.setParam('mix', 0.1)
    expect(ctx.workletNodes[0].port.posted.count).toBe(0)
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
        compileWasm('https://example.test/wasm/dattorro.wasm'),
        compileWasm(new URL('https://example.test/wasm/dattorro.wasm')),
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
      wasm: () => new URL('../wasm/dattorro.wasm', import.meta.url),
      params: DATTORRO_PARAMS,
    })
    expect((definition.wasm() as URL).pathname.endsWith('/wasm/dattorro.wasm')).toBe(true)
    expect((DATTORRO_DEVICE.wasm() as URL).pathname.endsWith('/wasm/dattorro.wasm')).toBe(true)
  })

  it('WasmDevice.create works with any definition, not only stock devices', async () => {
    const ctx = createMockContext()
    const custom = defineWasmDevice({
      id: 'custom',
      wasm: () => dattorroModule,
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
})

describe('WasmDevice notes and custom processors', () => {
  it('posts note-on/off over the port and honours a definition-level processor', async () => {
    const ctx = createMockContext()
    const custom = defineWasmDevice({
      id: 'app-synth',
      wasm: () => dattorroModule,
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
})
