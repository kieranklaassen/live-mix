import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { asAudioContext, createMockContext, type MockAudioContext } from '../../testing'
import {
  isMeteredDevice,
  isModulatedDevice,
  isNoteWatchDevice,
  isSampleWatchDevice,
} from '../../core/devices/Device'
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

afterEach(() => {
  vi.restoreAllMocks()
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

  describe('modulation', () => {
    const sine = {
      routes: [
        {
          source: {
            kind: 'lfo' as const,
            shape: 'sine' as const,
            rateHz: 1,
            depth: 1,
            anchorPhase: 0,
            anchorSec: 0,
          },
          depth: 0.25,
          polarity: 'bipolar' as const,
        },
      ],
    }

    it('hands the audio thread a parameter’s travel, base and routes, and says it changed', async () => {
      const ctx = createMockContext()
      const device = await createPlateReverb(asAudioContext(ctx), {
        wasm: plateModule,
        processorUrl: 'p',
        createNode: mockNodeFactory,
        params: { mix: 0.5 },
      })
      expect(isModulatedDevice(device)).toBe(true)
      const changes: unknown[] = []
      device.onChange((change) => changes.push(change))
      device.modulate('mix', sine)
      const posted = ctx.workletNodes[0].port.posted.calls.map((call) => call[0])
      expect(posted).toEqual([
        {
          type: 'modulate',
          paramId: 0,
          travel: { min: 0, max: 1, default: PLATE_REVERB_PARAMS.mix.default, taper: 'linear' },
          base: 0.5,
          modulation: sine,
        },
      ])
      expect(changes).toEqual([{ type: 'modulation', name: 'mix' }])
      expect(device.modulationOf('mix')).toBe(sine)
      expect(device.modulationOf('decay')).toBeUndefined()
    })

    it('keeps the set value as the base and says where the parameter is at a moment', async () => {
      const ctx = createMockContext()
      const device = await createPlateReverb(asAudioContext(ctx), {
        wasm: plateModule,
        processorUrl: 'p',
        createNode: mockNodeFactory,
        params: { mix: 0.5 },
      })
      device.modulate('mix', sine)
      expect(device.getParam('mix')).toBe(0.5)
      expect(device.paramAt('mix', 0.25)).toBeCloseTo(0.75, 12)
      expect(device.paramAt('mix', 0.75)).toBeCloseTo(0.25, 12)
      // Left out, the moment is the context's now.
      ctx.currentTime = 0.25
      expect(device.paramAt('mix')).toBeCloseTo(0.75, 12)
      // A parameter nothing moves is where it is set.
      expect(device.paramAt('decay', 3)).toBe(device.getParam('decay'))
      device.setParam('mix', 0.6)
      expect(device.getParam('mix')).toBe(0.6)
      expect(device.paramAt('mix', 0.25)).toBeCloseTo(0.85, 12)
    })

    it('ends a modulation once, and does nothing for a parameter that stood still', async () => {
      const ctx = createMockContext()
      const device = await createPlateReverb(asAudioContext(ctx), {
        wasm: plateModule,
        processorUrl: 'p',
        createNode: mockNodeFactory,
        params: { mix: 0.5 },
      })
      device.modulate('decay', null)
      device.modulate('decay', { routes: [] })
      expect(ctx.workletNodes[0].port.posted.count).toBe(0)
      device.modulate('mix', sine)
      device.modulate('mix', null)
      device.modulate('mix', null)
      const posted = ctx.workletNodes[0].port.posted.calls.map((call) => call[0])
      expect(posted).toHaveLength(2)
      expect(posted[1]).toMatchObject({ type: 'modulate', paramId: 0, base: 0.5, modulation: null })
      expect(device.modulationOf('mix')).toBeUndefined()
      expect(device.paramAt('mix', 0.25)).toBe(0.5)
      expect(() => device.modulate('nope' as 'mix', sine)).toThrow(/no parameter/)
    })

    it('is made with what moves it, in the processor’s options: no message to wait for', async () => {
      const ctx = createMockContext()
      const device = await createPlateReverb(asAudioContext(ctx), {
        wasm: plateModule,
        processorUrl: 'p',
        createNode: mockNodeFactory,
        params: { mix: 0.4 },
        modulations: { mix: sine, nope: sine, decay: { routes: [] } },
      })
      const options = ctx.workletNodes[0].options as {
        processorOptions: WasmDeviceProcessorOptions
      }
      // The names it has, with something to move them: the rest is left out.
      expect(options.processorOptions.modulations).toEqual([
        {
          paramId: 0,
          travel: { min: 0, max: 1, default: PLATE_REVERB_PARAMS.mix.default, taper: 'linear' },
          base: 0.4,
          modulation: sine,
        },
      ])
      expect(ctx.workletNodes[0].port.posted.count).toBe(0)
      expect(device.modulationOf('mix')).toBe(sine)
      expect(device.modulationOf('decay')).toBeUndefined()
      expect(device.paramAt('mix', 0.25)).toBeCloseTo(0.65, 12)
      // And it ends as any other does.
      device.modulate('mix', null)
      expect(ctx.workletNodes[0].port.posted.calls[0][0]).toMatchObject({
        type: 'modulate',
        base: 0.4,
        modulation: null,
      })
    })

    it('a device on a processor of its own takes none', async () => {
      const ctx = createMockContext()
      const own = defineWasmDevice({
        id: 'own',
        wasm: () => plateModule,
        params: PLATE_REVERB_PARAMS,
        processor: { name: 'app-processor', url: () => 'app-processor.js' },
      })
      const device = await WasmDevice.create(asAudioContext(ctx), own, {
        createNode: mockNodeFactory,
        modulations: { mix: sine },
      })
      const options = ctx.workletNodes[0].options as {
        processorOptions: WasmDeviceProcessorOptions
      }
      expect(options.processorOptions.modulations).toBeUndefined()
      expect(device.modulationOf('mix')).toBeUndefined()
      expect(device.modulates).toBe(false)
      expect(isModulatedDevice(device)).toBe(false)
      expect(() => device.modulate('mix', sine)).toThrow(/takes no modulation/)
      expect(ctx.workletNodes[0].port.posted.count).toBe(0)
    })
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

  it('remembers the notes it was sent, the held ones and the ones let go a while, for a display', async () => {
    const clock = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const ctx = createMockContext()
    const device = await WasmDevice.create(asAudioContext(ctx), PLATE_REVERB_DEVICE, {
      wasm: plateModule,
      createNode: mockNodeFactory,
    })
    expect(isNoteWatchDevice(device)).toBe(true)
    expect(device.playedNotes()).toEqual([])
    device.noteOn(60, 261.63, 0.8)
    clock.mockReturnValue(1500)
    device.noteOn(64, 329.63)
    clock.mockReturnValue(2000)
    device.noteOff(60)
    expect(device.playedNotes()).toEqual([
      { id: 60, frequency: 261.63, gain: 0.8, onMs: 1000, offMs: 2000 },
      { id: 64, frequency: 329.63, gain: 0.5, onMs: 1500, offMs: null },
    ])
    // A key struck again while it is held is a new note, and the one before it is let go.
    clock.mockReturnValue(2500)
    device.noteOn(64, 329.63, 0.3)
    expect(device.playedNotes().map((note) => [note.id, note.onMs, note.offMs])).toEqual([
      [60, 1000, 2000],
      [64, 1500, 2500],
      [64, 2500, null],
    ])
    // A note let go is kept a minute, long enough for the longest tail to ring out; a held one is kept.
    clock.mockReturnValue(2000 + 60_001)
    expect(device.playedNotes().map((note) => [note.id, note.onMs])).toEqual([
      [64, 1500],
      [64, 2500],
    ])
    clock.mockReturnValue(120_000)
    expect(device.playedNotes().map((note) => note.onMs)).toEqual([2500])
    // No more than a hundred and twenty-eight are remembered: the oldest goes first.
    for (let key = 0; key < 140; key++) device.noteOn(100 + key, 440)
    expect(device.playedNotes()).toHaveLength(128)
    expect(device.playedNotes()[0].id).toBe(112)
    expect(device.playedNotes().at(-1)?.id).toBe(239)
  })

  it('keeps a held key while a run of other notes goes by: the oldest note let go makes room', async () => {
    const clock = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const ctx = createMockContext()
    const device = await WasmDevice.create(asAudioContext(ctx), PLATE_REVERB_DEVICE, {
      wasm: plateModule,
      createNode: mockNodeFactory,
    })
    // A drone held under an arpeggio: two hundred notes in twenty seconds, each let go before the next.
    device.noteOn(36, 65.41, 0.7)
    for (let step = 0; step < 200; step++) {
      clock.mockReturnValue(1100 + step * 100)
      device.noteOn(300 + step, 440)
      clock.mockReturnValue(1150 + step * 100)
      device.noteOff(300 + step)
    }
    const played = device.playedNotes()
    expect(played).toHaveLength(128)
    // The drone still sounds, so it is still there for its display to light, first as the oldest.
    expect(played[0]).toMatchObject({ id: 36, onMs: 1000, offMs: null })
    // What went was the oldest of the run, and the newest are all kept.
    expect(played[1].id).toBe(300 + 200 - 127)
    expect(played.at(-1)?.id).toBe(499)
    // Let go at last, it is forgotten like any other once the run needs its place.
    clock.mockReturnValue(30_000)
    device.noteOff(36)
    device.noteOn(600, 440)
    expect(device.playedNotes().some((note) => note.id === 36)).toBe(false)
    expect(device.playedNotes()).toHaveLength(128)
  })

  it('hands a sample device copies of at most two channels and leaves the caller its buffers', async () => {
    const ctx = createMockContext()
    const device = await WasmDevice.create(asAudioContext(ctx), PLATE_REVERB_DEVICE, {
      wasm: plateModule,
      createNode: mockNodeFactory,
    })
    const left = Float32Array.of(0.1, 0.2, 0.3)
    const right = Float32Array.of(-0.1, -0.2, -0.3)
    // Until it is handed a sound it says nothing of one, and an empty one is not a sound.
    expect(isSampleWatchDevice(device)).toBe(true)
    expect(device.loadedSampleSeconds()).toBeNull()
    device.loadSample([], 48000)
    expect(device.loadedSampleSeconds()).toBeNull()
    device.loadSample([left, right, Float32Array.of(9)], 44100)
    // Three frames at 44.1 kHz, said after the copies were handed over.
    expect(device.loadedSampleSeconds()).toBeCloseTo(3 / 44100, 9)
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
