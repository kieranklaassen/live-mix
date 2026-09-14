// Drives the worklet processor class in Node by shimming the
// AudioWorkletGlobalScope globals before the module registers itself.

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { type MockMessagePort } from '../../testing'
import { type DeviceHostMessage, type DeviceMessage } from '../abi'
import { DATTORRO_PARAMS } from '../devices/dattorro'
// Registers the processor into the shimmed `registerProcessor`.
import '../worklets/wasm-device.processor'

type ProcessorCtor = new (options?: AudioWorkletNodeOptions) => {
  port: MockMessagePort
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean
}

const registry = vi.hoisted(() => {
  const processors = new Map<string, unknown>()
  class AudioWorkletProcessorShim {
    port = new MockMessagePortShim()
  }
  // A tiny stand-in with the same shape as testing/MockMessagePort, defined
  // here because hoisted code runs before imports resolve.
  class MockMessagePortShim {
    posted: unknown[] = []
    onmessage: ((event: { data: unknown }) => void) | null = null
    postMessage(message: unknown): void {
      this.posted.push(message)
    }
    receive(data: unknown): void {
      this.onmessage?.({ data })
    }
  }
  Object.assign(globalThis, {
    AudioWorkletProcessor: AudioWorkletProcessorShim,
    registerProcessor: (name: string, ctor: unknown) => processors.set(name, ctor),
    sampleRate: 48000,
  })
  return processors
})

const wasmPath = join(dirname(fileURLToPath(import.meta.url)), '../wasm/dattorro.wasm')
let module: WebAssembly.Module

beforeAll(async () => {
  module = await WebAssembly.compile(await readFile(wasmPath))
})

function construct(params?: (readonly [number, number])[]) {
  const Processor = registry.get('live-mix-wasm-device') as ProcessorCtor
  const processor = new Processor({
    processorOptions: { module, deviceId: 'dattorro', params },
  })
  const port = processor.port as unknown as {
    posted: unknown[]
    receive(data: DeviceMessage): void
  }
  return { processor, port }
}

function block(fill: number, frames = 128): Float32Array[][] {
  return [[new Float32Array(frames).fill(fill), new Float32Array(frames).fill(fill)]]
}

function outputs(frames = 128): Float32Array[][] {
  return [[new Float32Array(frames), new Float32Array(frames)]]
}

describe('WasmDeviceProcessor', () => {
  it('registers under the shared processor name and reports ready', () => {
    const { port } = construct()
    expect(port.posted[0]).toEqual({
      type: 'ready',
      deviceId: 'dattorro',
      maxBlockFrames: 2048,
    } satisfies DeviceHostMessage)
  })

  it('applies initial params and forwards set-param messages to the device', () => {
    const { processor, port } = construct([[DATTORRO_PARAMS.mix.id, 0]])
    const out = outputs()
    processor.process(block(0.25), out)
    // mix 0 → pure dry pass-through.
    expect(out[0][0][0]).toBeCloseTo(0.25, 6)
    expect(out[0][1][127]).toBeCloseTo(0.25, 6)

    port.receive({ type: 'set-param', paramId: DATTORRO_PARAMS.mix.id, value: 0.35 })
    const later = outputs()
    processor.process(block(1), later)
    // dry·(1−mix): the first tail samples are still in the pre-delay.
    expect(later[0][0][0]).toBeCloseTo(0.65, 3)
  })

  it('treats a disconnected input as silence', () => {
    const { processor } = construct([[DATTORRO_PARAMS.mix.id, 0]])
    const out = outputs()
    out[0][0].fill(9)
    processor.process([[]], out)
    expect(Math.max(...out[0][0])).toBe(0)
  })

  it('bypass crossfades to the dry signal and back without a hard switch', () => {
    const { processor, port } = construct([[DATTORRO_PARAMS.mix.id, 1]])
    // Wet-only at mix 1: before any tail arrives the output is silence.
    const wet = outputs()
    processor.process(block(0.5), wet)
    expect(Math.abs(wet[0][0][0])).toBeLessThan(1e-6)

    port.receive({ type: 'bypass', enabled: true })
    const ramping = outputs(512)
    processor.process(block(0.5, 512), ramping)
    // 5 ms at 48 kHz = 240 samples: mid-ramp is partial, the end is fully dry.
    expect(ramping[0][0][0]).toBeGreaterThan(0)
    expect(ramping[0][0][0]).toBeLessThan(0.5)
    expect(ramping[0][0][120]).toBeGreaterThan(ramping[0][0][0])
    expect(ramping[0][0][511]).toBeCloseTo(0.5, 3)

    port.receive({ type: 'bypass', enabled: false })
    const back = outputs(512)
    processor.process(block(0.5, 512), back)
    expect(back[0][0][0]).toBeCloseTo(0.5, 2)
    expect(Math.abs(back[0][0][511])).toBeLessThan(0.5)
  })

  it('throws on an unknown message', () => {
    const { port } = construct()
    expect(() => port.receive({ type: 'nope' } as unknown as DeviceMessage)).toThrow(
      /unhandled device message/,
    )
  })

  it('refuses to construct without a module', () => {
    const Processor = registry.get('live-mix-wasm-device') as ProcessorCtor
    expect(() => new Processor({ processorOptions: {} })).toThrow(/processorOptions.module/)
  })
})
