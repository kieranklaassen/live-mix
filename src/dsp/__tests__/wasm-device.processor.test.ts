// Drives the worklet processor class in Node by shimming the
// AudioWorkletGlobalScope globals before the module registers itself.

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { type MockMessagePort } from '../../testing'
import { type DeviceHostMessage, type DeviceMessage } from '../abi'
import { AMBIENT_COMP_PARAMS } from '../devices/ambient-comp.gen'
import { PLATE_REVERB_PARAMS } from '../devices/plate-reverb'
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

const wasmDir = join(dirname(fileURLToPath(import.meta.url)), '../wasm')
let module: WebAssembly.Module
// A device with a meter: the compressor reports its gain reduction.
let compModule: WebAssembly.Module
// A device that takes time: the limiter looks 77 samples ahead.
let limiterModule: WebAssembly.Module

beforeAll(async () => {
  ;[module, compModule, limiterModule] = await Promise.all(
    ['plate-reverb.wasm', 'ambient-comp.wasm', 'ambient-limiter.wasm'].map(async (file) =>
      WebAssembly.compile(await readFile(join(wasmDir, file))),
    ),
  )
})

function construct(
  params?: (readonly [number, number])[],
  device: { module: WebAssembly.Module; deviceId: string; latencySamples?: number } = {
    module,
    deviceId: 'plate-reverb',
  },
) {
  const Processor = registry.get('live-mix-wasm-device') as ProcessorCtor
  const processor = new Processor({
    processorOptions: { ...device, params },
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
      deviceId: 'plate-reverb',
      maxBlockFrames: 2048,
    } satisfies DeviceHostMessage)
  })

  it('applies initial params and forwards set-param messages to the device', () => {
    const { processor, port } = construct([[PLATE_REVERB_PARAMS.mix.id, 0]])
    const out = outputs()
    processor.process(block(0.25), out)
    // mix 0 → pure dry pass-through.
    expect(out[0][0][0]).toBeCloseTo(0.25, 6)
    expect(out[0][1][127]).toBeCloseTo(0.25, 6)

    port.receive({ type: 'set-param', paramId: PLATE_REVERB_PARAMS.mix.id, value: 0.35 })
    const later = outputs()
    processor.process(block(1), later)
    // dry·(1−mix): the first tail samples are still in the pre-delay.
    expect(later[0][0][0]).toBeCloseTo(0.65, 3)
  })

  it('treats a disconnected input as silence', () => {
    const { processor } = construct([[PLATE_REVERB_PARAMS.mix.id, 0]])
    const out = outputs()
    out[0][0].fill(9)
    processor.process([[]], out)
    expect(Math.max(...out[0][0])).toBe(0)
  })

  it('bypass crossfades to the dry signal and back without a hard switch', () => {
    const { processor, port } = construct([[PLATE_REVERB_PARAMS.mix.id, 1]])
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

  it('a full bypass leaves a device behind whose output is no number', () => {
    const { processor, port } = construct()
    // One block that is no number is enough for the reverb's memory: once it
    // is through the pre-delay, everything that comes out is NaN.
    processor.process(block(Number.NaN), outputs())
    const poisoned = outputs()
    for (let index = 0; index < 20; index += 1) processor.process(block(0.25), poisoned)
    expect(poisoned[0][0][127]).toBeNaN()

    port.receive({ type: 'bypass', enabled: true })
    // 5 ms at 48 kHz = 240 samples: the block after this one is past the ramp.
    const ramp = outputs(512)
    processor.process(block(0.25, 512), ramp)
    // On the way there the dry signal fades in, with nothing of the device beside it:
    // no sample is NaN, and none steps to the full level at the ramp's end.
    for (const channel of ramp[0]) {
      expect(channel.every((sample) => Number.isFinite(sample))).toBe(true)
      expect(channel[0]).toBeGreaterThan(0)
      expect(channel[0]).toBeLessThan(0.01)
      for (let index = 1; index < 240; index += 1) {
        expect(channel[index] - channel[index - 1]).toBeGreaterThanOrEqual(0)
        expect(channel[index] - channel[index - 1]).toBeLessThan(0.01)
      }
      expect(channel[239]).toBeCloseTo(0.25, 6)
      expect(channel[511]).toBe(0.25)
    }
    const dry = outputs()
    processor.process(block(0.25), dry)
    expect([Math.min(...dry[0][0]), Math.max(...dry[0][0])]).toEqual([0.25, 0.25])
    expect([Math.min(...dry[0][1]), Math.max(...dry[0][1])]).toEqual([0.25, 0.25])

    // Taken out of bypass it is the device again, as it is: what it puts out is not hidden.
    port.receive({ type: 'bypass', enabled: false })
    processor.process(block(0.25, 512), outputs(512))
    const back = outputs()
    processor.process(block(0.25), back)
    expect(back[0][0][127]).toBeNaN()
  })

  it('ignores note messages on an effect module (no device_note_on export)', () => {
    const { processor, port } = construct([[PLATE_REVERB_PARAMS.mix.id, 0]])
    port.receive({ type: 'note-on', noteId: 1, frequency: 440, gain: 0.5 })
    port.receive({ type: 'note-off', noteId: 1 })
    const out = outputs()
    processor.process(block(0.25), out)
    expect(out[0][0][0]).toBeCloseTo(0.25, 6)
  })

  describe('meters', () => {
    const P = AMBIENT_COMP_PARAMS
    /** The compressor set to bite at once: everything over −60 dB, ten to one, 10 ms. */
    const fast: (readonly [number, number])[] = [
      [P.threshold.id, -60],
      [P.ratio.id, 10],
      [P.attack.id, 10],
      [P.knee.id, 0],
    ]
    const comp = () => construct(fast, { module: compModule, deviceId: 'ambient-comp' })
    const meters = (port: { posted: unknown[] }) =>
      (port.posted as DeviceHostMessage[]).filter((message) => message.type === 'meters')

    /** Blocks of a 1 kHz sine at half scale, continuous from one block to the next. */
    function tone(processor: { process: ProcessorCtor['prototype']['process'] }, blocks: number) {
      for (let index = 0; index < blocks; index += 1) {
        const samples = Float32Array.from(
          { length: 128 },
          (_, frame) => 0.5 * Math.sin((2 * Math.PI * 1000 * (index * 128 + frame)) / 48000),
        )
        processor.process([[samples, samples.slice()]], outputs())
      }
    }

    it('posts nothing until the meters are asked for', () => {
      const { processor, port } = comp()
      tone(processor, 40)
      expect(meters(port)).toEqual([])
    })

    it('reports the device meters once every interval while they are watched', () => {
      const { processor, port } = comp()
      port.receive({ type: 'meters', count: 1, intervalFrames: 256 })
      // The first report goes out with the next block, then one every two blocks.
      tone(processor, 1)
      expect(meters(port)).toHaveLength(1)
      tone(processor, 4)
      expect(meters(port)).toHaveLength(3)

      // A third of a second in, the compressor is well into the tone.
      tone(processor, 120)
      const reports = meters(port)
      const last = reports[reports.length - 1]
      expect(last.values).toHaveLength(1)
      expect(last.values[0]).toBeLessThan(-20)
      expect(last.values[0]).toBeGreaterThan(-60)
      // It got there by degrees: one block in, it had only begun.
      expect(reports[0].values[0]).toBeGreaterThan(-6)
      expect(reports[0].values[0]).toBeLessThanOrEqual(0)

      port.receive({ type: 'meters', count: 0, intervalFrames: 256 })
      tone(processor, 20)
      expect(meters(port)).toHaveLength(reports.length)
    })

    it('reports nothing for a module without meters, however many are asked for', () => {
      const { processor, port } = construct()
      port.receive({ type: 'meters', count: 2, intervalFrames: 128 })
      processor.process(block(0.25), outputs())
      processor.process(block(0.25), outputs())
      expect(meters(port)).toEqual([])
    })
  })

  it('lets go of its instance when disposed, without waiting to be rendered again', () => {
    const { processor, port } = construct([[PLATE_REVERB_PARAMS.mix.id, 0]])
    const held = processor as unknown as { device: unknown; outLeft: Float32Array }
    processor.process(block(0.25), outputs())
    expect(held.device).not.toBeNull()
    expect(held.outLeft.buffer.byteLength).toBeGreaterThan(0)

    // An offline context never renders again once it is done: the message alone has to free the memory.
    port.receive({ type: 'dispose' })
    expect(held.device).toBeNull()
    // No view into the instance's memory is left to keep it.
    expect(held.outLeft.buffer.byteLength).toBe(0)

    // Rendered again after all (a live context), it ends the node and writes nothing.
    const out = outputs()
    expect(processor.process(block(0.25), out)).toBe(false)
    expect(Math.max(...out[0][0])).toBe(0)
    // What is still on its way to a disposed device is dropped.
    expect(() => {
      port.receive({ type: 'set-param', paramId: PLATE_REVERB_PARAMS.mix.id, value: 1 })
      port.receive({ type: 'note-on', noteId: 1, frequency: 220, gain: 0.5 })
      port.receive({ type: 'dispose' })
    }).not.toThrow()
  })

  describe('a device that takes time', () => {
    const LATENCY = 77
    // A sound no two samples of which are alike, quiet enough for the limiter to leave alone.
    const sound = (n: number) => 0.25 * Math.sin(n * 0.0731) + 0.001 * (n % 97)

    /** Run `blocks` blocks of `sound` from sample `from`; returns the left output of them all. */
    function run(
      processor: ReturnType<typeof construct>['processor'],
      from: number,
      blocks: number,
      frames = 128,
    ): Float32Array {
      const all = new Float32Array(blocks * frames)
      for (let index = 0; index < blocks; index += 1) {
        const input = new Float32Array(frames)
        for (let i = 0; i < frames; i += 1) input[i] = sound(from + index * frames + i)
        const out = outputs(frames)
        processor.process([[input, input.slice()]], out)
        all.set(out[0][0], index * frames)
        // Both channels carry the same dry sound.
        expect(Array.from(out[0][1])).toEqual(Array.from(out[0][0]))
      }
      return all
    }

    const limiter = () =>
      construct(undefined, {
        module: limiterModule,
        deviceId: 'ambient-limiter',
        latencySamples: LATENCY,
      })

    it('plays the dry signal as late as the device plays its own, sample for sample', () => {
      const { processor, port } = limiter()
      port.receive({ type: 'bypass', enabled: true })
      // 5 ms at 48 kHz = 240 samples: the third block on is past the crossfade.
      const heard = run(processor, 0, 6)
      for (let n = 256; n < heard.length; n += 1) {
        expect(heard[n], `sample ${n}`).toBe(Math.fround(sound(n - LATENCY)))
      }
    })

    it('has the sound from before the bypass ready: nothing is skipped or heard twice', () => {
      const { processor, port } = limiter()
      // The device runs for a while before it is turned off.
      const active = run(processor, 0, 8)
      // Working, it is 77 samples late: what it plays at n is the sound of n − 77.
      expect(active[900]).toBeCloseTo(sound(900 - LATENCY), 3)
      port.receive({ type: 'bypass', enabled: true })
      const heard = run(processor, 8 * 128, 4)
      for (let n = 256; n < heard.length; n += 1) {
        expect(heard[n], `sample ${n}`).toBe(Math.fround(sound(8 * 128 + n - LATENCY)))
      }
    })

    it('keeps the delay over blocks longer than it and over an input taken away', () => {
      const { processor, port } = limiter()
      port.receive({ type: 'bypass', enabled: true })
      const heard = run(processor, 0, 2, 512)
      for (let n = 256; n < heard.length; n += 1) {
        expect(heard[n], `sample ${n}`).toBe(Math.fround(sound(n - LATENCY)))
      }
      // The input goes: the last 77 samples of it are still to come, then silence.
      const tail = outputs()
      processor.process([[]], tail)
      for (let i = 0; i < 128; i += 1) {
        const expected = i < LATENCY ? Math.fround(sound(1024 + i - LATENCY)) : 0
        expect(tail[0][0][i], `sample ${i}`).toBe(expected)
      }
    })

    it('told of no latency, plays the dry signal as it comes', () => {
      const { processor, port } = construct(undefined, {
        module: limiterModule,
        deviceId: 'ambient-limiter',
      })
      port.receive({ type: 'bypass', enabled: true })
      const heard = run(processor, 0, 4)
      for (let n = 256; n < heard.length; n += 1) expect(heard[n]).toBe(Math.fround(sound(n)))
    })
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
