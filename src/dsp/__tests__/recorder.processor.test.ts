// Drives the capture worklet processor in Node by shimming the
// AudioWorkletGlobalScope globals before the module registers itself.

import { describe, expect, it, vi } from 'vitest'

import {
  RECORDER_PROCESSOR_NAME,
  type RecorderHostMessage,
  type RecorderMessage,
} from '../../core/render/recorder-protocol'
import '../worklets/recorder.processor'

type ProcessorCtor = new (options?: AudioWorkletNodeOptions) => {
  port: { posted: [unknown, unknown[] | undefined][]; receive(data: unknown): void }
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean
}

const registry = vi.hoisted(() => {
  const processors = new Map<string, unknown>()
  const clock = { currentTime: 0 }
  class MockMessagePortShim {
    posted: [unknown, unknown[] | undefined][] = []
    onmessage: ((event: { data: unknown }) => void) | null = null
    postMessage(message: unknown, transfer?: unknown[]): void {
      this.posted.push([message, transfer])
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
  Object.defineProperty(globalThis, 'currentTime', {
    configurable: true,
    get: () => clock.currentTime,
  })
  return { processors, clock }
})

function construct(chunkFrames = 256, channelCount = 2) {
  const Processor = registry.processors.get(RECORDER_PROCESSOR_NAME) as ProcessorCtor
  const processor = new Processor({ processorOptions: { channelCount, chunkFrames } })
  const messages = () => processor.port.posted.map(([message]) => message as RecorderHostMessage)
  const chunks = () => messages().filter((message) => message.type === 'chunk')
  const send = (message: RecorderMessage) => processor.port.receive(message)
  return { processor, messages, chunks, send }
}

function block(value: number, frames = 128): Float32Array[] {
  return [new Float32Array(frames).fill(value), new Float32Array(frames).fill(-value)]
}

describe('recorder processor', () => {
  it('ignores input until started, then posts full chunks with transferred buffers', () => {
    const { processor, chunks, send } = construct(256)
    processor.process([block(0.5)], [])
    expect(chunks()).toHaveLength(0)

    send({ type: 'start' })
    processor.process([block(0.25)], [])
    expect(chunks()).toHaveLength(0)
    processor.process([block(0.75)], [])
    const [chunk] = chunks()
    expect(chunk.type).toBe('chunk')
    if (chunk.type !== 'chunk') throw new Error('unreachable')
    expect(chunk.frames).toBe(256)
    expect(chunk.startFrame).toBe(0)
    expect(chunk.channels[0][0]).toBe(0.25)
    expect(chunk.channels[0][200]).toBe(0.75)
    expect(chunk.channels[1][200]).toBe(-0.75)
    const transfer = processor.port.posted[0][1]
    expect(transfer).toHaveLength(2)
    expect(transfer?.[0]).toBe(chunk.channels[0].buffer)
  })

  it('stop flushes the partial chunk and reports the total frame count', () => {
    const { processor, messages, chunks, send } = construct(256)
    send({ type: 'start' })
    processor.process([block(1)], [])
    processor.process([block(1)], [])
    processor.process([block(0.5)], [])
    send({ type: 'stop' })
    const all = chunks()
    expect(all).toHaveLength(2)
    const tail = all[1]
    if (tail.type !== 'chunk') throw new Error('unreachable')
    expect(tail.frames).toBe(128)
    expect(tail.startFrame).toBe(256)
    expect(tail.channels[0].length).toBe(128)
    expect(tail.channels[0][0]).toBe(0.5)
    const last = messages()[messages().length - 1]
    expect(last).toEqual({ type: 'stopped', totalFrames: 384 })

    processor.process([block(1)], [])
    expect(chunks()).toHaveLength(2)
  })

  it('honours a scheduled start time on the audio clock', () => {
    const { processor, chunks, send } = construct(128)
    registry.clock.currentTime = 0
    send({ type: 'start', at: 1 })
    processor.process([block(1)], [])
    expect(chunks()).toHaveLength(0)
    registry.clock.currentTime = 1.5
    processor.process([block(1)], [])
    expect(chunks()).toHaveLength(1)
  })

  it('records silence when the input is disconnected and spreads mono input across channels', () => {
    const { processor, chunks, send } = construct(128)
    send({ type: 'start' })
    processor.process([[]], [])
    processor.process([[new Float32Array(128).fill(0.3)]], [])
    const [silent, mono] = chunks()
    if (silent.type !== 'chunk' || mono.type !== 'chunk') throw new Error('unreachable')
    expect(silent.channels[0].every((sample) => sample === 0)).toBe(true)
    expect(mono.channels[0][5]).toBeCloseTo(0.3)
    expect(mono.channels[1][5]).toBeCloseTo(0.3)
    expect(mono.startFrame).toBe(128)
  })

  it('flush posts what has accumulated without stopping', () => {
    const { processor, chunks, messages, send } = construct(1024)
    send({ type: 'start' })
    processor.process([block(0.1)], [])
    send({ type: 'flush' })
    expect(chunks()).toHaveLength(1)
    expect(messages().some((message) => message.type === 'stopped')).toBe(false)
    processor.process([block(0.2)], [])
    send({ type: 'stop' })
    expect(chunks()).toHaveLength(2)
    expect(chunks()[1].type === 'chunk' && chunks()[1].startFrame).toBe(128)
  })
})
