// Drives the ducker worklet processor class in Node by shimming the
// AudioWorkletGlobalScope globals before the module registers itself: the
// deterministic offline path for the exact code that runs in the audio thread.

import { describe, expect, it, vi } from 'vitest'

import { DUCK_DEPTH } from '../../core/devices/native/Ducker'
import {
  DUCKER_PARAMS,
  DUCKER_PROCESSOR_NAME,
  type DuckerHostMessage,
  type DuckerMessage,
} from '../../core/devices/native/ducker-abi'
// Registers the processor into the shimmed `registerProcessor`.
import '../worklets/ducker.processor'

const SAMPLE_RATE = 48_000
const BLOCK = 128

type ProcessorCtor = new (options?: AudioWorkletNodeOptions) => {
  port: { posted: unknown[]; receive(data: DuckerMessage): void }
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

function construct(processorOptions?: Record<string, unknown>) {
  const Processor = registry.get(DUCKER_PROCESSOR_NAME) as ProcessorCtor
  const processor = new Processor(processorOptions ? { processorOptions } : undefined)
  return { processor, port: processor.port }
}

function channels(fill: number, frames = BLOCK): Float32Array[] {
  return [new Float32Array(frames).fill(fill), new Float32Array(frames).fill(fill)]
}

function outputs(frames = BLOCK): Float32Array[][] {
  return [[new Float32Array(frames), new Float32Array(frames)]]
}

/** Run `seconds` of constant signal and key through the processor; returns the last output. */
function run(
  processor: ReturnType<typeof construct>['processor'],
  signal: number,
  key: number | null,
  seconds: number,
): Float32Array[] {
  const blocks = Math.round((seconds * SAMPLE_RATE) / BLOCK)
  let out = outputs()
  for (let i = 0; i < blocks; i += 1) {
    out = outputs()
    processor.process([channels(signal), key === null ? [] : channels(key)], out)
  }
  return out[0]
}

const last = (posted: unknown[]) => posted[posted.length - 1] as DuckerHostMessage

describe('DuckerProcessor', () => {
  it('registers under the shared name and reports ready with the window size', () => {
    const { port } = construct()
    expect(port.posted[0]).toEqual({ type: 'ready', windowSize: 256 } satisfies DuckerHostMessage)
    const custom = construct({ windowSize: 64 })
    expect(custom.port.posted[0]).toEqual({ type: 'ready', windowSize: 64 })
  })

  it('passes the signal at unity with no key, then ducks it when the key speaks', () => {
    const { processor } = construct({ reportHz: 0 })
    const quiet = run(processor, 0.5, null, 0.2)
    expect(quiet[0][BLOCK - 1]).toBeCloseTo(0.5, 6)
    expect(quiet[1][BLOCK - 1]).toBeCloseTo(0.5, 6)

    const ducked = run(processor, 0.5, 0.5, 1.5)
    expect(ducked[0][BLOCK - 1]).toBeCloseTo(0.5 * (1 - DUCK_DEPTH), 4)
    expect(ducked[1][BLOCK - 1]).toBeCloseTo(0.5 * (1 - DUCK_DEPTH), 4)

    // Key disconnected again (`inputs[1]` empty): release back toward unity.
    const released = run(processor, 0.5, null, 4)
    expect(released[0][BLOCK - 1]).toBeGreaterThan(0.5 * 0.95)
  })

  it('applies initial params and forwards set-param messages', () => {
    const { processor, port } = construct({
      params: [[DUCKER_PARAMS.depth.id, 0.5]],
      reportHz: 0,
    })
    const half = run(processor, 1, 0.5, 1.5)
    expect(half[0][BLOCK - 1]).toBeCloseTo(0.5, 4)

    port.receive({ type: 'set-param', paramId: DUCKER_PARAMS.depth.id, value: 0.25 })
    const quarter = run(processor, 1, 0.5, 1.5)
    expect(quarter[0][BLOCK - 1]).toBeCloseTo(0.75, 4)

    expect(() => port.receive({ type: 'set-param', paramId: 99, value: 1 })).toThrow(
      /no parameter id 99/,
    )
  })

  it('reports envelope and gain at the configured rate, and not at all when disabled', () => {
    const { processor, port } = construct({ reportHz: 30 })
    port.posted.length = 0
    run(processor, 1, 0.5, 1)
    // 30 Hz over one second: 30 reports (±1 for block rounding).
    const reports = port.posted.filter((m) => (m as DuckerHostMessage).type === 'envelope')
    expect(reports.length).toBeGreaterThanOrEqual(29)
    expect(reports.length).toBeLessThanOrEqual(31)
    const report = last(port.posted)
    expect(report.type).toBe('envelope')
    if (report.type === 'envelope') {
      expect(report.envelope).toBeCloseTo(0.5, 3)
      expect(report.gain).toBeCloseTo(1 - DUCK_DEPTH, 3)
    }

    const silent = construct({ reportHz: 0 })
    silent.port.posted.length = 0
    run(silent.processor, 1, 0.5, 1)
    expect(silent.port.posted).toHaveLength(0)
  })

  it('bypass crossfades to the dry signal and back', () => {
    const { processor, port } = construct({ reportHz: 0 })
    run(processor, 0.5, 1, 1)
    port.receive({ type: 'bypass', enabled: true })
    const ramping = outputs(512)
    processor.process([channels(0.5, 512), channels(1, 512)], ramping)
    // 5 ms at 48 kHz = 240 samples: the start is still ducked, the end is dry.
    expect(ramping[0][0][0]).toBeLessThan(0.5)
    expect(ramping[0][0][0]).toBeGreaterThan(0.5 * (1 - DUCK_DEPTH))
    expect(ramping[0][0][120]).toBeGreaterThan(ramping[0][0][0])
    expect(ramping[0][0][511]).toBeCloseTo(0.5, 5)

    port.receive({ type: 'bypass', enabled: false })
    const back = outputs(512)
    processor.process([channels(0.5, 512), channels(1, 512)], back)
    expect(back[0][0][511]).toBeCloseTo(0.5 * (1 - DUCK_DEPTH), 3)
  })

  it('stop freezes the follower; dispose ends processing', () => {
    const { processor, port } = construct({ reportHz: 0 })
    run(processor, 1, 0.5, 0.05)
    port.receive({ type: 'stop' })
    const frozen = run(processor, 1, 0, 1)
    const settled = run(processor, 1, 0, 1)
    expect(settled[0][BLOCK - 1]).toBeCloseTo(frozen[0][BLOCK - 1], 4)
    expect(settled[0][BLOCK - 1]).toBeLessThan(1)

    port.receive({ type: 'dispose' })
    expect(processor.process([channels(1), channels(1)], outputs())).toBe(false)
  })

  it('treats a missing signal input as silence and an odd output as harmless', () => {
    const { processor } = construct({ reportHz: 0 })
    const out = outputs()
    out[0][0].fill(9)
    processor.process([[], channels(1)], out)
    expect(Math.max(...out[0][0])).toBe(0)
    expect(processor.process([channels(1)], [[]])).toBe(true)
  })

  it('throws on an unknown message', () => {
    const { port } = construct()
    expect(() => port.receive({ type: 'nope' } as unknown as DuckerMessage)).toThrow(
      /unhandled ducker message/,
    )
  })
})
