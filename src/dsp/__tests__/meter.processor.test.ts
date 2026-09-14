// Drives the meter worklet processor in Node by shimming the
// AudioWorkletGlobalScope globals before the module registers itself.

import { describe, expect, it, vi } from 'vitest'

import { type MeterReading } from '../../core/analysis/loudness'
import { dbToGain } from '../../core/devices/native/units'
import { type MeterHostMessage, type MeterMessage } from '../../core/analysis/meter-protocol'
// Registers the processor into the shimmed `registerProcessor`.
import '../worklets/meter.processor'

type ProcessorCtor = new (options?: AudioWorkletNodeOptions) => {
  port: { posted: unknown[]; receive(data: unknown): void }
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean
}

const SAMPLE_RATE = 48000
const BLOCK = 128

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

function construct(intervalMs?: number) {
  const Processor = registry.get('live-mix-meter') as ProcessorCtor
  const processor = new Processor({ processorOptions: { intervalMs } })
  const readings = () =>
    (processor.port.posted as MeterHostMessage[])
      .filter((message) => message.type === 'reading')
      .map((message) => message.reading)
  const lastReading = (): MeterReading => {
    const all = readings()
    if (all.length === 0) throw new Error('no reading posted')
    return all[all.length - 1]
  }
  return { processor, port: processor.port, readings, lastReading }
}

/** Feeds `seconds` of a stereo sine and returns the number of blocks processed. */
function feedSine(
  processor: { process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean },
  seconds: number,
  gain: number,
  frequency = 997,
): number {
  const blocks = Math.round((seconds * SAMPLE_RATE) / BLOCK)
  const left = new Float32Array(BLOCK)
  const right = new Float32Array(BLOCK)
  let n = 0
  for (let b = 0; b < blocks; b += 1) {
    for (let i = 0; i < BLOCK; i += 1) {
      const v = gain * Math.sin((2 * Math.PI * frequency * n) / SAMPLE_RATE)
      left[i] = v
      right[i] = v
      n += 1
    }
    processor.process([[left, right]], [])
  }
  return blocks
}

describe('MeterProcessor', () => {
  it('registers under the shared name and posts readings at the requested cadence', () => {
    const { processor, readings } = construct(50)
    const blocks = feedSine(processor, 1, 0.1)
    // 50 ms = 2400 frames = 18.75 blocks → one reading every 19 blocks.
    expect(readings()).toHaveLength(Math.floor(blocks / 19))
  })

  it('never posts faster than 30 Hz even when asked to', () => {
    const { processor, readings } = construct(1)
    feedSine(processor, 1, 0.1)
    expect(readings().length).toBeLessThanOrEqual(30)
    expect(readings().length).toBeGreaterThanOrEqual(28)
  })

  it('measures the −23 LUFS reference tone', () => {
    const { processor, lastReading } = construct(100)
    feedSine(processor, 4, dbToGain(-23))
    const last = lastReading()
    expect(last.momentary).toBeCloseTo(-23, 1)
    expect(last.shortTerm).toBeCloseTo(-23, 1)
    expect(last.integrated).toBeCloseTo(-23, 1)
    expect(last.samplePeak[0]).toBeCloseTo(dbToGain(-23), 3)
    expect(last.maxTruePeak).toBeGreaterThanOrEqual(last.samplePeak[0])
    expect(last.elapsedSec).toBeCloseTo(4, 1)
  })

  it('treats a disconnected input as silence and keeps posting', () => {
    const { processor, readings, lastReading } = construct(50)
    for (let b = 0; b < 40; b += 1) processor.process([[]], [])
    // Posts land on blocks 19 and 38; the silence still advances the clock.
    expect(readings()).toHaveLength(2)
    const last = lastReading()
    expect(last.momentary).toBe(-Infinity)
    expect(last.samplePeak).toEqual([0, 0])
    expect(last.elapsedSec).toBeCloseTo((38 * BLOCK) / SAMPLE_RATE, 6)
  })

  it('reset clears the integrated measurement, set-interval changes the cadence', () => {
    const { processor, port, readings, lastReading } = construct(50)
    feedSine(processor, 1, dbToGain(-13))
    expect(lastReading().integrated).toBeCloseTo(-13, 1)

    port.receive({ type: 'reset' } satisfies MeterMessage)
    port.receive({ type: 'set-interval', intervalMs: 500 } satisfies MeterMessage)
    const before = readings().length
    feedSine(processor, 1.1, dbToGain(-23))
    // 500 ms = 187.5 blocks: posts on blocks 188 and 376 of the 412 fed.
    const after = readings().slice(before)
    expect(after).toHaveLength(2)
    expect(lastReading().integrated).toBeCloseTo(-23, 1)
    expect(lastReading().elapsedSec).toBeCloseTo((376 * BLOCK) / SAMPLE_RATE, 6)
  })

  it('dispose makes process() return false so the node can be collected', () => {
    const { processor, port } = construct()
    expect(processor.process([[]], [])).toBe(true)
    port.receive({ type: 'dispose' } satisfies MeterMessage)
    expect(processor.process([[]], [])).toBe(false)
  })

  it('throws on an unknown message', () => {
    const { port } = construct()
    expect(() => port.receive({ type: 'nope' })).toThrow(/unhandled meter message/)
  })
})
