// Drives the voice cleanup worklet processors in Node by shimming the
// AudioWorkletGlobalScope globals before the module registers them: the
// exact code that runs in the audio thread, offline.

import { describe, expect, it, vi } from 'vitest'

import {
  CLEANUP_KINDS,
  CLEANUP_REPORT_HZ,
  cleanupProcessorName,
  type CleanupHostMessage,
  type CleanupKind,
  type CleanupMessage,
} from '../../core/devices/native/cleanup/abi'
// Registers the six processors into the shimmed `registerProcessor`.
import '../worklets/cleanup.processor'

const SAMPLE_RATE = 48_000
const BLOCK = 128

type ProcessorCtor = new (options?: AudioWorkletNodeOptions) => {
  port: { posted: unknown[]; receive(data: CleanupMessage): void }
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean
}

const registry = vi.hoisted(() => {
  const processors = new Map<string, unknown>()
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
  class AudioWorkletProcessorShim {
    port = new MockMessagePortShim()
  }
  Object.assign(globalThis, {
    AudioWorkletProcessor: AudioWorkletProcessorShim,
    registerProcessor: (name: string, ctor: unknown) => processors.set(name, ctor),
    sampleRate: 48000,
  })
  return processors
})

function construct(kind: CleanupKind, processorOptions?: Record<string, unknown>) {
  const Processor = registry.get(cleanupProcessorName(kind)) as ProcessorCtor
  return new Processor({ processorOptions: { kind, ...processorOptions } })
}

/** `seconds` of a 60 Hz hum at −20 dBFS through `processor`, a block at a time. */
function hum(processor: ReturnType<typeof construct>, seconds: number): Float32Array[] {
  let out: Float32Array[] = []
  for (let block = 0; block < (seconds * SAMPLE_RATE) / BLOCK; block += 1) {
    const signal = Float32Array.from(
      { length: BLOCK },
      (_, i) => 0.1 * Math.sin((2 * Math.PI * 60 * (block * BLOCK + i)) / SAMPLE_RATE),
    )
    out = [new Float32Array(BLOCK), new Float32Array(BLOCK)]
    processor.process([[signal]], [out])
  }
  return out
}

describe('the cleanup processors', () => {
  it('registers one processor for each kind, each saying it is ready', () => {
    for (const kind of CLEANUP_KINDS) {
      const processor = construct(kind)
      expect(processor.port.posted[0]).toEqual({ type: 'ready' } satisfies CleanupHostMessage)
    }
  })

  it('applies the parameters it was made with and reports the dB it took off at the report rate', () => {
    const processor = construct('de-hum', { params: [[3, 40]] })
    hum(processor, 1)
    const meters = processor.port.posted.filter((m) => (m as CleanupHostMessage).type === 'meter')
    expect(meters.length).toBeGreaterThanOrEqual(CLEANUP_REPORT_HZ - 1)
    const lastReport = meters[meters.length - 1] as Extract<CleanupHostMessage, { type: 'meter' }>
    expect(lastReport.reduction).toBeGreaterThan(30)
  })

  it('follows a parameter and a bypass sent while it runs, and stops when disposed', () => {
    const processor = construct('de-hum', { reportHz: 0 })
    processor.port.receive({ type: 'set-param', paramId: 3, value: 0 })
    const untouched = hum(processor, 0.5)
    const expected = Float32Array.from(
      { length: BLOCK },
      (_, i) =>
        0.1 *
        Math.sin(
          (2 * Math.PI * 60 * (Math.round((0.5 * SAMPLE_RATE) / BLOCK - 1) * BLOCK + i)) /
            SAMPLE_RATE,
        ),
    )
    for (let i = 0; i < BLOCK; i += 1) expect(untouched[1][i]).toBeCloseTo(expected[i], 6)
    expect(processor.port.posted).toEqual([{ type: 'ready' }])

    processor.port.receive({ type: 'dispose' })
    expect(processor.process([[new Float32Array(BLOCK)]], [[new Float32Array(BLOCK)]])).toBe(false)
  })

  it('refuses a parameter id its kind does not have', () => {
    const processor = construct('de-ess')
    expect(() => processor.port.receive({ type: 'set-param', paramId: 9, value: 1 })).toThrow(
      /de-ess has no parameter id 9/,
    )
  })
})
