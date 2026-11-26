// Drives the room's worklet processor in Node by shimming the
// AudioWorkletGlobalScope globals before the module registers itself.

import { readFileSync } from 'node:fs'

import { describe, expect, it, vi } from 'vitest'

import {
  SPACE_ROOM_PROCESSOR_NAME,
  SPACE_ROOM_QUANTUM,
  type SpaceRoomExports,
} from '../../core/tracks/space-kernel-abi'
import { spaceTransformTables } from '../../core/tracks/SpaceKernel'
import '../worklets/space-room.processor'

type Processor = {
  port: { posted: unknown[]; onmessage: ((event: { data: unknown }) => void) | null }
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean
}

const registry = vi.hoisted(() => {
  const processors = new Map<string, unknown>()
  class PortShim {
    posted: unknown[] = []
    onmessage: ((event: { data: unknown }) => void) | null = null
    postMessage(message: unknown): void {
      this.posted.push(message)
    }
  }
  Object.assign(globalThis, {
    AudioWorkletProcessor: class {
      port = new PortShim()
    },
    registerProcessor: (name: string, ctor: unknown) => processors.set(name, ctor),
  })
  return processors
})

/** A room whose impulse is one sample of a half, on its own memory. */
function construct(): Processor {
  const memory = new WebAssembly.Memory({ initial: 16, maximum: 16_384, shared: true })
  const module = new WebAssembly.Module(
    readFileSync(new URL('../wasm/space-room.wasm', import.meta.url)),
  )
  const kernel = new WebAssembly.Instance(module, { env: { memory } })
    .exports as unknown as SpaceRoomExports
  const size = SPACE_ROOM_QUANTUM
  let next = 131_072
  const floats = (count: number): number => {
    const at = next
    next += Math.ceil((count * 4) / 64) * 64
    return at
  }
  const tables = floats(4096)
  new Float32Array(memory.buffer, tables, 4096).set(spaceTransformTables(size))
  const samples = floats(2 * size)
  const spectra = floats(2 * 2 * size)
  new Float32Array(memory.buffer, samples, 1)[0] = 0.5 / size
  for (const channel of [0, 1])
    kernel.room_spectrum(spectra + channel * 2 * size * 4, size, tables, samples)
  const room = floats(kernel.room_bytes() / 4)
  kernel.room_init(room, 3)
  kernel.room_level(
    room,
    size,
    1,
    tables,
    spectra,
    floats(4 * size),
    floats(4 * size),
    floats(4 * size),
    floats(2 * size),
    floats(2 * size),
    0,
  )
  const Ctor = registry.get(SPACE_ROOM_PROCESSOR_NAME) as new (options: unknown) => Processor
  return new Ctor({ processorOptions: { module, memory, room } })
}

const block = (value: number): Float32Array => new Float32Array(SPACE_ROOM_QUANTUM).fill(value)
const outputs = (): Float32Array[][] => [[block(0), block(0)], [block(0)]]

describe('space-room processor', () => {
  it('convolves both channels and says with its second output that it sounds', () => {
    const processor = construct()
    const out = outputs()
    expect(processor.process([[block(1), block(-1)]], out)).toBe(true)
    expect(out[0][0][64]).toBeCloseTo(0.5, 6)
    expect(out[0][1][64]).toBeCloseTo(-0.5, 6)
    expect([...out[1][0]]).toEqual([...block(1)])
  })

  it('takes one channel as both', () => {
    const processor = construct()
    const out = outputs()
    processor.process([[block(1)]], out)
    expect(out[0][1][64]).toBeCloseTo(0.5, 6)
  })

  it('writes nothing once it has rung out, with nothing connected too', () => {
    const processor = construct()
    processor.process([[block(1), block(1)]], outputs())
    for (let i = 0; i < 3; i += 1) {
      const ringing = outputs()
      processor.process([[]], ringing)
      expect(ringing[1][0][0]).toBe(1)
    }
    const out = outputs()
    expect(processor.process([[]], out)).toBe(true)
    expect(out[1][0][0]).toBe(0)
    expect(out[0][0].some((sample) => sample !== 0)).toBe(false)
  })

  it('answers the page once it will not touch the memory again', () => {
    const processor = construct()
    processor.port.onmessage?.({ data: 'end' })
    expect(processor.port.posted).toEqual(['ended'])
    const out = outputs()
    expect(processor.process([[block(1), block(1)]], out)).toBe(false)
    expect(out[0][0][0]).toBe(0)
  })
})
