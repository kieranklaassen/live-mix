import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  asAudioContext,
  createMockContext,
  type MockAudioNode,
  type MockAudioContext,
  type MockAudioWorkletNode,
} from '../../../testing'
import { createEngine, type Engine } from '../../Engine'
import { setWorkletNodeConstructor, type WorkletNodeConstructor } from '../../worklet-node'
import type { AudioTrack } from '../AudioTrack'
import type { SpaceRoomExports, SpaceRoomProcessorOptions } from '../space-kernel-abi'
import {
  SpaceKernel,
  type RoomConvolver,
  spacePartitions,
  spaceTransformTables,
} from '../SpaceKernel'

const RATE = 48000
const QUANTUM = 128
const wasm = readFileSync(new URL('../../../dsp/wasm/space-room.wasm', import.meta.url))

/** A repeatable noise of -1..1. */
function noise(seed: number): () => number {
  let state = seed
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0
    return state / 2 ** 31 - 1
  }
}

function impulseOf(ctx: MockAudioContext, frames: number, channels = 2, rate = RATE): AudioBuffer {
  const buffer = ctx.createBuffer(channels, frames, rate) as unknown as AudioBuffer
  const random = noise(frames)
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < frames; i += 1) data[i] = random() * 0.05 * 10 ** ((-3 * i) / frames)
  }
  return buffer
}

function context(): MockAudioContext {
  const ctx = createMockContext({ sampleRate: RATE })
  const made = function (_: BaseAudioContext, name: string, options: unknown) {
    return ctx.createWorkletNode(name, options)
  }
  setWorkletNodeConstructor(asAudioContext(ctx), made as unknown as WorkletNodeConstructor)
  return ctx
}

const asMock = (node: AudioNode): MockAudioNode => node as unknown as MockAudioNode
const optionsOf = (node: MockAudioWorkletNode): SpaceRoomProcessorOptions =>
  (node.options as AudioWorkletNodeOptions).processorOptions as SpaceRoomProcessorOptions

/** What the audio thread's half does with a room. */
function runner(node: MockAudioWorkletNode) {
  const { module, memory, room } = optionsOf(node)
  const exports = new WebAssembly.Instance(module, { env: { memory } })
    .exports as unknown as SpaceRoomExports
  const into = new Float32Array(memory.buffer, exports.room_in(room), 2 * QUANTUM)
  const out = new Float32Array(memory.buffer, exports.room_out(room), 2 * QUANTUM)
  return (left: Float32Array, right: Float32Array): Float32Array | null => {
    into.set(left)
    into.set(right, QUANTUM)
    return exports.room_process(room) === 0 ? null : out
  }
}

/** Two channels of `frames` through the room, a block at a time. */
function through(node: MockAudioWorkletNode, input: Float32Array[]): Float32Array[] {
  const run = runner(node)
  const heard = input.map((channel) => new Float32Array(channel.length))
  for (let at = 0; at < input[0].length; at += QUANTUM) {
    const out = run(input[0].subarray(at, at + QUANTUM), input[1].subarray(at, at + QUANTUM))
    if (!out) continue
    heard[0].set(out.subarray(0, QUANTUM), at)
    heard[1].set(out.subarray(QUANTUM), at)
  }
  return heard
}

beforeEach(() => vi.stubGlobal('crossOriginIsolated', true))
afterEach(() => vi.unstubAllGlobals())

describe('spacePartitions', () => {
  it('covers an impulse from its first sample to its last, each size after the one before it', () => {
    for (const frames of [1, 128, 2047, 2048, 2049, 16384, 16385, 240000]) {
      const cut = spacePartitions(frames)
      let upTo = 0
      for (const { size, from, partitions } of cut) {
        expect(from).toBe(upTo)
        upTo += size * partitions
      }
      expect(upTo).toBeGreaterThanOrEqual(frames)
      expect(upTo - frames).toBeLessThan(cut[cut.length - 1].size)
    }
  })

  it('asks nothing of a size before two of its own hops', () => {
    for (const { size, from } of spacePartitions(240000).slice(1)) expect(from).toBe(2 * size)
  })
})

describe('spaceTransformTables', () => {
  it('has the twist and the twiddles of every stage', () => {
    // 128 points: one stage of two (2 x 64), then 64 and 16 of four.
    expect(spaceTransformTables(128)).toHaveLength(2 * 128 + 2 * 64 + 6 * 16 + 6 * 4)
    // 1024 points: 1024, 256, 64 and 16 of four.
    expect(spaceTransformTables(1024)).toHaveLength(2 * 1024 + 6 * (256 + 64 + 16 + 4))
  })
})

describe('SpaceKernel', () => {
  const made = (kernel: SpaceKernel, impulse: AudioBuffer): RoomConvolver => {
    const room = kernel.make(impulse)
    if (!room) throw new Error('no room')
    return room
  }
  const kernelOn = async (ctx: MockAudioContext, setTimeoutFn = () => 0) => {
    const kernel = await SpaceKernel.create(asAudioContext(ctx), {
      wasm,
      processorUrl: 'room.js',
      setTimeoutFn,
    })
    if (!kernel) throw new Error('no kernel')
    return kernel
  }

  it.each([100, 3000, 30000])('convolves with an impulse of %i samples', async (frames) => {
    const ctx = context()
    const kernel = await kernelOn(ctx)
    const impulse = impulseOf(ctx, frames)
    expect(kernel.make(impulse)).not.toBeNull()
    const blocks = 400
    const random = noise(7)
    const input = [0, 1].map(() => Float32Array.from({ length: blocks * QUANTUM }, random))
    const heard = through(ctx.workletNodes[0], input)
    // Straight from what a convolution is, at places all over.
    const worst = [0, 0]
    for (let at = 5; at < blocks * QUANTUM; at += 331) {
      for (let channel = 0; channel < 2; channel += 1) {
        const response = impulse.getChannelData(channel)
        let sum = 0
        for (let k = 0; k < frames && k <= at; k += 1) sum += response[k] * input[channel][at - k]
        worst[channel] = Math.max(worst[channel], Math.abs(sum - heard[channel][at]))
      }
    }
    expect(Math.max(...worst)).toBeLessThan(2e-6)
  })

  it('keeps rooms of one impulse apart', async () => {
    const ctx = context()
    const kernel = await kernelOn(ctx)
    const impulse = impulseOf(ctx, 3000)
    kernel.make(impulse)
    kernel.make(impulse)
    const [first, second] = ctx.workletNodes
    const random = noise(3)
    const input = [0, 1].map(() => Float32Array.from({ length: 20 * QUANTUM }, random))
    through(first, input)
    const silence = [0, 1].map(() => new Float32Array(20 * QUANTUM))
    expect(Math.max(...through(second, silence)[0])).toBe(0)
  })

  it('says when a room has rung out, and starts again with what comes in next', async () => {
    const ctx = context()
    const kernel = await kernelOn(ctx)
    kernel.make(impulseOf(ctx, 3000))
    const run = runner(ctx.workletNodes[0])
    const silence = new Float32Array(QUANTUM)
    const one = new Float32Array(QUANTUM).fill(0.5)
    // It has not begun to ring.
    expect(run(silence, silence)).toBeNull()
    expect(run(one, one)).not.toBeNull()
    let last: Float32Array | null = null
    let blocks = 0
    for (let out = run(silence, silence); out; out = run(silence, silence)) {
      last = out.slice()
      blocks += 1
    }
    expect(blocks).toBeGreaterThan(3000 / QUANTUM)
    expect(last?.every((sample) => Math.abs(sample) < 1e-7)).toBe(true)
    expect(run(one, silence)).not.toBeNull()
  })

  it('opens a gate behind the room with what the room says of itself', async () => {
    const ctx = context()
    const kernel = await kernelOn(ctx)
    const room = made(kernel, impulseOf(ctx, 1000))
    const [node] = ctx.workletNodes
    const gate = ctx.gains[0]
    expect(asMock(room.input)).toBe(node)
    expect(asMock(room.output)).toBe(gate)
    expect(gate.gain.value).toBe(0)
    expect(node.connectCalls.calls).toEqual([
      [gate, 0],
      [gate.gain, 1],
    ])
  })

  it('takes a room that has rung out from the graph, and puts it back', async () => {
    const ctx = context()
    const kernel = await kernelOn(ctx)
    const room = made(kernel, impulseOf(ctx, 1000))
    const [node] = ctx.workletNodes
    const gate = ctx.gains[0]
    const run = runner(node)
    const silence = new Float32Array(QUANTUM)
    run(new Float32Array(QUANTUM).fill(1), silence)
    expect(room.rest?.()).toBe(false)
    expect(node.isConnectedTo(gate)).toBe(true)
    while (run(silence, silence)) {
      // Until it has rung out.
    }
    expect(room.rest?.()).toBe(true)
    expect(node.isConnectedTo(gate)).toBe(false)
    expect(room.rest?.()).toBe(true)
    room.wake?.()
    expect(node.isConnectedTo(gate)).toBe(true)
    const before = node.connectCalls.count
    room.wake?.()
    expect(node.connectCalls.count).toBe(before)
    room.dispose()
    room.wake?.()
    expect(node.isConnectedTo(gate)).toBe(false)
  })

  it('gives a room its ground back once the audio thread has let go of it', async () => {
    const ctx = context()
    const kernel = await kernelOn(ctx)
    const impulse = impulseOf(ctx, 30000)
    kernel.make(impulse)?.dispose()
    const [first] = ctx.workletNodes
    expect(first.port.posted.calls).toEqual([['end', undefined]])
    kernel.make(impulse)?.dispose()
    // Not yet said: the second has ground of its own.
    expect(optionsOf(ctx.workletNodes[1]).room).not.toBe(optionsOf(first).room)
    first.port.receive('ended')
    kernel.make(impulse)
    expect(optionsOf(ctx.workletNodes[2]).room).toBe(optionsOf(first).room)
    // And there is nothing left in it of the room that was there.
    const silence = new Float32Array(QUANTUM)
    expect(runner(ctx.workletNodes[2])(silence, silence)).toBeNull()
  })

  it('keeps rooms of the impulse in use ready, and lets go of those of another', async () => {
    const turns: (() => void)[] = []
    const ctx = context()
    const kernel = await kernelOn(ctx, ((turn: () => void) => turns.push(turn)) as never)
    const run = (): void => {
      for (let turn = turns.shift(); turn; turn = turns.shift()) turn()
    }
    const first = impulseOf(ctx, 1000)
    kernel.prepare(first)
    run()
    expect(ctx.workletNodes).toHaveLength(2)
    const room = made(kernel, first)
    expect(asMock(room.input)).toBe(ctx.workletNodes[0])
    run()
    expect(ctx.workletNodes).toHaveLength(3)
    kernel.prepare(impulseOf(ctx, 2000))
    expect(ctx.workletNodes[1].port.posted.calls).toEqual([['end', undefined]])
    expect(ctx.workletNodes[2].port.posted.calls).toEqual([['end', undefined]])
    run()
    expect(ctx.workletNodes).toHaveLength(5)
    kernel.dispose()
    expect(ctx.workletNodes[4].port.posted.calls).toEqual([['end', undefined]])
    expect(kernel.make(first)).toBeNull()
  })

  it('takes two channels at the rate of its context, and nothing else', async () => {
    const ctx = context()
    const kernel = await kernelOn(ctx)
    expect(kernel.make(impulseOf(ctx, 1000, 1))).toBeNull()
    expect(kernel.make(impulseOf(ctx, 1000, 2, 44100))).toBeNull()
    expect(ctx.workletNodes).toHaveLength(0)
  })

  it('is not there without a page that can share a memory, nor in a render', async () => {
    const ctx = asAudioContext(context())
    expect(SpaceKernel.supported(ctx)).toBe(true)
    const render = Object.assign(context(), { startRendering: () => undefined })
    expect(SpaceKernel.supported(asAudioContext(render))).toBe(false)
    vi.stubGlobal('crossOriginIsolated', false)
    expect(SpaceKernel.supported(ctx)).toBe(false)
    expect(await SpaceKernel.create(ctx, { wasm, processorUrl: 'room.js' })).toBeNull()
  })
})

describe('EngineOptions.spaceKernel', () => {
  const play = (ctx: MockAudioContext, engine: Engine): AudioTrack => {
    const track = engine.addAudioTrack('pads')
    track.play(
      'k',
      {
        buffer: ctx.createBuffer(2, 10 * RATE, RATE) as unknown as AudioBuffer,
        offsetSec: 0,
        durationSec: 5,
        fadeInSec: 0,
        fadeOutSec: 0,
        fadeCurve: 'linear',
        spaceDb: -6,
      },
      1,
    )
    return track
  }

  it("leaves the rooms the browser's when it is not asked for, and where it cannot be", async () => {
    const plain = context()
    const engine = createEngine({ context: asAudioContext(plain) })
    expect(await engine.spaceKernelReady).toBe(false)
    expect(play(plain, engine).space).toBe(plain.convolvers[0])

    vi.stubGlobal('crossOriginIsolated', false)
    const ctx = context()
    const asked = createEngine({
      context: asAudioContext(ctx),
      spaceKernel: { wasm, processorUrl: 'room.js' },
    })
    expect(await asked.spaceKernelReady).toBe(false)
    expect(play(ctx, asked).space).toBe(ctx.convolvers[0])
    expect(ctx.audioWorklet.modules).toEqual([])
  })

  it("leaves the rooms the browser's when it does not load", async () => {
    const ctx = context()
    const engine = createEngine({
      context: asAudioContext(ctx),
      spaceKernel: { wasm: new Uint8Array([1, 2, 3]), processorUrl: 'room.js' },
    })
    expect(await engine.spaceKernelReady).toBe(false)
    expect(play(ctx, engine).space).toBe(ctx.convolvers[0])
  })

  it('convolves a room in the kernel, and tells how long it rings', async () => {
    const ctx = context()
    const engine = createEngine({
      context: asAudioContext(ctx),
      spaceKernel: { wasm, processorUrl: 'room.js', setTimeoutFn: () => 0 },
    })
    expect(await engine.spaceKernelReady).toBe(true)
    const track = play(ctx, engine)
    expect(ctx.convolvers).toHaveLength(0)
    expect(track.space).toBeNull()
    expect(track.spaceTailSec).toBeCloseTo(engine.spaceImpulse().duration)
    expect(ctx.workletNodes.map((node) => node.name)).toEqual(['live-mix-space-room'])
    expect(ctx.gains.some((gain) => gain.isConnectedTo(ctx.workletNodes[0]))).toBe(true)
  })

  it("makes a room that was the browser's anew once it is there", async () => {
    const ctx = context()
    const engine = createEngine({
      context: asAudioContext(ctx),
      spaceKernel: { wasm, processorUrl: 'room.js', setTimeoutFn: () => 0 },
    })
    play(ctx, engine)
    const sendsInto = (node: MockAudioNode): boolean =>
      ctx.gains.some((gain) => gain.isConnectedTo(node))
    expect(sendsInto(ctx.convolvers[0])).toBe(true)
    expect(await engine.spaceKernelReady).toBe(true)
    expect(sendsInto(ctx.convolvers[0])).toBe(false)
    expect(sendsInto(ctx.workletNodes[0])).toBe(true)
  })
})
