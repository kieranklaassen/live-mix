// What a track's room convolves with when the browser's own node is not to:
// `space-room.wasm` on the audio thread (`cpp/space-room/space_room.cpp` says
// how it convolves), one worklet node for each room.
//
// A `ConvolverNode` costs in step with the length of its impulse, and a room
// of some seconds is by far the costliest stock node there is. The same
// convolution in here takes a tenth of the time or less, is as immediate, and
// differs from the node's by the rounding of 32-bit floats, some 130 dB under
// the sound.
//
// All of an engine's rooms lie in one memory, which the page and the audio
// thread share. The page lays a room out in it, makes the spectra of the
// impulse (once for all the rooms that hold it), and hands the audio thread
// an address, so making a room costs that thread nothing. Sharing a memory
// takes a page that is cross-origin isolated. Where it is not, or the context
// renders offline, or anything of it does not load, a room has the browser's
// node as it always had.

import { ensureProcessor } from '../worklet-loader'
import { createWorkletNode } from '../worklet-node'
import {
  SPACE_ROOM_PROCESSOR_NAME,
  SPACE_ROOM_QUANTUM,
  SPACE_ROOM_QUIET,
  SPACE_ROOM_STATE_INTS,
  SPACE_ROOM_TAIL,
  type SpaceRoomExports,
  type SpaceRoomMessage,
  type SpaceRoomProcessorOptions,
} from './space-kernel-abi'

/** What a room convolves with: what goes in at `input` comes back at `output`. */
export interface RoomConvolver {
  readonly input: AudioNode
  readonly output: AudioNode
  /**
   * Nothing is connected to it: it leaves the graph once it has rung out, so
   * that what it feeds has nothing to do either. False while it still rings.
   */
  rest?(): boolean
  /** Something is about to be connected to it. */
  wake?(): void
  /** Takes it out of the graph. What it still rings with is lost. */
  dispose(): void
}

/** The sizes an impulse is cut into: each comes in after the one before it, at twice its own length. */
export const SPACE_PARTITIONS = [128, 1024, 8192] as const

/** How one size of an impulse lies: `partitions` of `size` samples from `from` on. */
export interface SpacePartition {
  size: number
  from: number
  partitions: number
}

/** How an impulse of `frames` samples is cut up. */
export function spacePartitions(frames: number): SpacePartition[] {
  const cut: SpacePartition[] = []
  let from = 0
  for (const [index, size] of SPACE_PARTITIONS.entries()) {
    const next = SPACE_PARTITIONS[index + 1]
    // The next size has nothing to say before two of its own hops.
    const upTo = next === undefined ? frames : Math.min(frames, 2 * next)
    const partitions = Math.ceil((upTo - from) / size)
    if (partitions <= 0) break
    cut.push({ size, from, partitions })
    from += partitions * size
  }
  return cut
}

/**
 * The tables of a transform of `size` points, in the order the kernel reads
 * them: the twist, then the twiddles of each stage from the longest.
 */
export function spaceTransformTables(size: number): Float32Array {
  const table: number[] = []
  for (let n = 0; n < size; n += 1) table.push(Math.cos((Math.PI * n) / (2 * size)))
  for (let n = 0; n < size; n += 1) table.push(Math.sin((Math.PI * n) / (2 * size)))
  const twiddles = (count: number, length: number, times: number): void => {
    for (let j = 0; j < count; j += 1) table.push(Math.cos((2 * Math.PI * j * times) / length))
    for (let j = 0; j < count; j += 1) table.push(-Math.sin((2 * Math.PI * j * times) / length))
  }
  let length = size
  if (Math.log2(size) % 2 === 1) {
    twiddles(length / 2, length, 1)
    length /= 2
  }
  for (; length > 4; length /= 4) {
    for (const times of [1, 2, 3]) twiddles(length / 4, length, times)
  }
  return Float32Array.from(table)
}

/** Where things lie in the memory: handed out in lines of 64 bytes, and back again by their size. */
class Ground {
  private next: number
  private readonly free = new Map<number, number[]>()
  private readonly sizes = new Map<number, number>()

  constructor(private readonly memory: WebAssembly.Memory) {
    // Below this is the stack the linker put there. The page's instance and the audio thread's would share it,
    // and neither has a use for it: nothing in the kernel is put on a stack.
    this.next = 131_072
  }

  /** Room for `count` floats, all zero. */
  floats(count: number): number {
    const bytes = Math.max(64, Math.ceil((count * 4) / 64) * 64)
    const again = this.free.get(bytes)?.pop()
    if (again !== undefined) {
      new Uint8Array(this.memory.buffer, again, bytes).fill(0)
      this.sizes.set(again, bytes)
      return again
    }
    const at = this.next
    const end = at + bytes
    if (end > this.memory.buffer.byteLength) {
      // A little ahead, so a piece that makes its rooms one by one does not grow it for each.
      const pages = Math.ceil((end - this.memory.buffer.byteLength) / 65_536)
      this.memory.grow(pages)
    }
    this.next = end
    this.sizes.set(at, bytes)
    return at
  }

  put(values: Float32Array): number {
    const at = this.floats(values.length)
    new Float32Array(this.memory.buffer, at, values.length).set(values)
    return at
  }

  back(at: number): void {
    const bytes = this.sizes.get(at)
    if (bytes === undefined) return
    this.sizes.delete(at)
    const of = this.free.get(bytes)
    if (of) of.push(at)
    else this.free.set(bytes, [at])
  }
}

/** An impulse as the rooms that hold it share it. */
interface Impulse {
  buffer: AudioBuffer
  cut: SpacePartition[]
  spectra: number[]
  rooms: number
}

/** A node that is ready and not yet any room's. */
interface Spare {
  buffer: AudioBuffer
  convolver: RoomConvolver
}

export interface SpaceKernelOptions {
  /** Where `addModule` loads the processor from (default: the bundled `worklets/space-room.js`). */
  processorUrl?: URL | string
  /** The kernel: a URL, its bytes, or the compiled module (default: the bundled `wasm/space-room.wasm`). */
  wasm?: URL | string | BufferSource | WebAssembly.Module
  /** Timers for making the next room ahead of time; the page's by default. */
  setTimeoutFn?: (callback: () => void, ms: number) => unknown
}

async function compileKernel(
  source: NonNullable<SpaceKernelOptions['wasm']>,
): Promise<WebAssembly.Module> {
  if (source instanceof WebAssembly.Module) return source
  if (typeof source !== 'string' && !(source instanceof URL)) return WebAssembly.compile(source)
  const response = await fetch(source)
  if (!response.ok)
    throw new Error(`live-mix: failed to fetch ${String(source)}: ${response.status}`)
  return WebAssembly.compile(await response.arrayBuffer())
}

/** How many rooms of the impulse in use are kept ready: a worklet node takes a moment to come alive, and a room is asked for as it is first sent to. */
const SPARE_ROOMS = 2

export class SpaceKernel {
  private readonly ground: Ground
  private readonly exports: SpaceRoomExports
  private readonly tables = new Map<number, number>()
  private readonly impulses: Impulse[] = []
  private readonly spares: Spare[] = []
  private wanted: AudioBuffer | null = null
  private made = 0
  private refilling = false
  private disposed = false
  private readonly setTimeoutFn: (callback: () => void, ms: number) => unknown

  private constructor(
    private readonly context: BaseAudioContext,
    private readonly module: WebAssembly.Module,
    private readonly memory: WebAssembly.Memory,
    options: SpaceKernelOptions,
  ) {
    this.ground = new Ground(memory)
    this.exports = new WebAssembly.Instance(module, { env: { memory } })
      .exports as unknown as SpaceRoomExports
    this.setTimeoutFn = options.setTimeoutFn ?? ((callback, ms) => setTimeout(callback, ms))
  }

  /** Whether a room on `context` can have it: a live context, on a page that can share a memory. */
  static supported(context: BaseAudioContext): boolean {
    if (typeof (context as Partial<OfflineAudioContext>).startRendering === 'function') return false
    const quantum = (context as { renderQuantumSize?: number }).renderQuantumSize
    return (
      (quantum === undefined || quantum === SPACE_ROOM_QUANTUM) &&
      typeof SharedArrayBuffer === 'function' &&
      (globalThis as { crossOriginIsolated?: boolean }).crossOriginIsolated === true &&
      typeof context.audioWorklet?.addModule === 'function'
    )
  }

  /** Loads the kernel and its processor. Null where a room cannot have it. */
  static async create(
    context: BaseAudioContext,
    options: SpaceKernelOptions = {},
  ): Promise<SpaceKernel | null> {
    if (!SpaceKernel.supported(context)) return null
    const url =
      options.processorUrl === undefined
        ? new URL('./worklets/space-room.js', import.meta.url).href
        : String(options.processorUrl)
    const [module] = await Promise.all([
      compileKernel(options.wasm ?? new URL('./wasm/space-room.wasm', import.meta.url)),
      ensureProcessor(context, url),
    ])
    const memory = new WebAssembly.Memory({ initial: 16, maximum: 16_384, shared: true })
    return new SpaceKernel(context, module, memory, options)
  }

  /** A convolution with `impulse`, or null for an impulse it does not take: it takes two channels at the context's own rate. */
  make(impulse: AudioBuffer): RoomConvolver | null {
    if (this.disposed || !this.takes(impulse)) return null
    const at = this.spares.findIndex((spare) => spare.buffer === impulse)
    const ready = at === -1 ? this.build(impulse) : this.spares.splice(at, 1)[0].convolver
    this.prepare(impulse)
    return ready
  }

  /** Has rooms of `impulse` ready for when they are asked for, and lets go of those of another. */
  prepare(impulse: AudioBuffer): void {
    if (this.disposed || !this.takes(impulse)) return
    this.wanted = impulse
    for (let index = this.spares.length - 1; index >= 0; index -= 1) {
      if (this.spares[index].buffer === impulse) continue
      this.spares.splice(index, 1)[0].convolver.dispose()
    }
    this.refill()
  }

  dispose(): void {
    this.disposed = true
    for (const spare of this.spares.splice(0)) spare.convolver.dispose()
  }

  private takes(impulse: AudioBuffer): boolean {
    return (
      impulse.numberOfChannels === 2 &&
      impulse.length > 0 &&
      impulse.sampleRate === this.context.sampleRate
    )
  }

  // One at a time, each in a turn of its own: the first of an impulse makes its spectra.
  private refill(): void {
    if (this.refilling || this.spares.length >= SPARE_ROOMS) return
    this.refilling = true
    this.setTimeoutFn(() => {
      this.refilling = false
      const impulse = this.wanted
      if (this.disposed || !impulse || this.spares.length >= SPARE_ROOMS) return
      this.spares.push({ buffer: impulse, convolver: this.build(impulse) })
      this.refill()
    }, 0)
  }

  private build(buffer: AudioBuffer): RoomConvolver {
    const impulse = this.impulse(buffer)
    impulse.rooms += 1
    const { ground, exports } = this
    const held: number[] = []
    const take = (count: number): number => {
      const at = ground.floats(count)
      held.push(at)
      return at
    }
    const room = take(exports.room_bytes() / 4)
    const last = SPACE_PARTITIONS[SPACE_PARTITIONS.length - 1]
    exports.room_init(room, Math.ceil((buffer.length + 3 * last) / SPACE_ROOM_QUANTUM) + 1)
    impulse.cut.forEach(({ size, partitions }, index) => {
      const hops = index === 0 ? 2 : 3
      // Rooms start their hops apart: the blocks in which one has the most to do are not the others'.
      const blocks = size / SPACE_ROOM_QUANTUM
      const offset =
        ((this.made * Math.max(1, Math.round(blocks * 0.38))) % blocks) * SPACE_ROOM_QUANTUM
      exports.room_level(
        room,
        size,
        partitions,
        this.table(size),
        impulse.spectra[index],
        take(2 * partitions * 2 * size),
        take(2 * 2 * size),
        take(2 * hops * size),
        take(2 * size),
        take(2 * size),
        offset,
      )
    })
    this.made += 1
    const processorOptions: SpaceRoomProcessorOptions = {
      module: this.module,
      memory: this.memory,
      room,
    }
    const node = createWorkletNode(this.context, SPACE_ROOM_PROCESSOR_NAME, {
      numberOfInputs: 1,
      numberOfOutputs: 2,
      outputChannelCount: [2, 1],
      channelCount: 2,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      processorOptions,
    })
    // Open while the room sounds: its value is 0 and the node's second output is added to it.
    const gate = this.context.createGain()
    gate.gain.automationRate = 'k-rate'
    gate.gain.value = 0
    const join = (): void => {
      node.connect(gate, 0)
      node.connect(gate.gain, 1)
    }
    join()
    const state = new Int32Array(this.memory.buffer, room, SPACE_ROOM_STATE_INTS)
    let resting = false
    let over = false
    return {
      input: node,
      output: gate,
      rest: () => {
        if (over || resting) return true
        if (state[SPACE_ROOM_QUIET] < state[SPACE_ROOM_TAIL]) return false
        resting = true
        node.disconnect()
        return true
      },
      wake: () => {
        if (over || !resting) return
        resting = false
        join()
      },
      dispose: () => {
        if (over) return
        over = true
        try {
          node.disconnect()
          gate.disconnect()
        } catch {
          // Context may already be closed; ignore.
        }
        // The memory is another room's only once the audio thread has said it is done with it.
        node.port.onmessage = () => {
          node.port.onmessage = null
          for (const at of held) ground.back(at)
          this.letGo(impulse)
        }
        const message: SpaceRoomMessage = 'end'
        node.port.postMessage(message)
      },
    }
  }

  private table(size: number): number {
    let at = this.tables.get(size)
    if (at === undefined) {
      at = this.ground.put(spaceTransformTables(size))
      this.tables.set(size, at)
    }
    return at
  }

  private impulse(buffer: AudioBuffer): Impulse {
    const known = this.impulses.find((impulse) => impulse.buffer === buffer)
    if (known) return known
    const { ground, exports, memory } = this
    const cut = spacePartitions(buffer.length)
    const spectra = cut.map(({ size, from, partitions }) => {
      const tables = this.table(size)
      const at = ground.floats(2 * partitions * 2 * size)
      const samples = ground.floats(2 * size)
      for (let channel = 0; channel < 2; channel += 1) {
        const data = buffer.getChannelData(channel)
        for (let p = 0; p < partitions; p += 1) {
          const part = data.subarray(from + p * size, from + (p + 1) * size)
          const padded = new Float32Array(memory.buffer, samples, size)
          padded.fill(0)
          // An inverse transform sums `size` bins: what it would divide by is taken off here.
          for (let i = 0; i < part.length; i += 1) padded[i] = part[i] / size
          exports.room_spectrum(
            at + (channel * partitions + p) * 2 * size * 4,
            size,
            tables,
            samples,
          )
        }
      }
      ground.back(samples)
      return at
    })
    const impulse: Impulse = { buffer, cut, spectra, rooms: 0 }
    this.impulses.push(impulse)
    return impulse
  }

  /** A room of `impulse` is gone; the last of one that is not wanted any more takes its spectra with it. */
  private letGo(impulse: Impulse): void {
    impulse.rooms -= 1
    if (impulse.rooms > 0 || impulse.buffer === this.wanted) return
    for (const at of impulse.spectra) this.ground.back(at)
    this.impulses.splice(this.impulses.indexOf(impulse), 1)
  }
}
