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
// an address, so making a room costs that thread next to nothing. Sharing a memory
// takes a page that is cross-origin isolated. Where it is not, or the context
// renders offline, or anything of it does not load, or the memory is full, a
// room has the browser's node as it always had.

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

const PAGE_BYTES = 65_536
/** How far a memory may grow: 1 GB. */
const MAXIMUM_PAGES = 16_384
/** How many pages it grows by at least, so a piece that makes its rooms one by one does not grow it for each. */
const GROWN_AHEAD_PAGES = 128
/**
 * Where the first thing lies. Under it is the stack the linker put there (`-z stack-size` in
 * `scripts/build-wasm.sh`) and as much again. The page's instance and the audio thread's share that stack, and
 * neither has a use for it: nothing in the kernel is put on a stack.
 */
const GROUND_FROM = 131_072

/** A stretch of the memory that nothing lies in. */
interface Gap {
  at: number
  bytes: number
}

/**
 * Where things lie in the memory: handed out in lines of 64 bytes, at the
 * first place that is free and large enough. What is given back joins what
 * is free beside it, so rooms of one length have the ground of another's.
 */
class Ground {
  private next = GROUND_FROM
  /** What was handed out and given back, in the order it lies. No two of them touch. */
  private readonly gaps: Gap[] = []
  private readonly sizes = new Map<number, number>()

  constructor(private readonly memory: WebAssembly.Memory) {}

  /** Room for `count` floats, all zero. Throws when the memory can not grow that far. */
  floats(count: number): number {
    const bytes = Math.max(64, Math.ceil((count * 4) / 64) * 64)
    const index = this.gaps.findIndex((gap) => gap.bytes >= bytes)
    const at = index === -1 ? this.beyond(bytes) : this.within(index, bytes)
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
    const later = this.gaps.findIndex((gap) => gap.at > at)
    const index = later === -1 ? this.gaps.length : later
    this.gaps.splice(index, 0, { at, bytes })
    this.join(index)
    if (index > 0) this.join(index - 1)
  }

  private within(index: number, bytes: number): number {
    const gap = this.gaps[index]
    const { at } = gap
    new Uint8Array(this.memory.buffer, at, bytes).fill(0)
    gap.at += bytes
    gap.bytes -= bytes
    if (gap.bytes === 0) this.gaps.splice(index, 1)
    return at
  }

  /** Past all that was ever handed out, or from the gap that ends there. */
  private beyond(bytes: number): number {
    const last = this.gaps.at(-1)
    const gap = last && last.at + last.bytes === this.next ? last : null
    const at = gap ? gap.at : this.next
    this.reach(at + bytes)
    if (gap) {
      new Uint8Array(this.memory.buffer, at, gap.bytes).fill(0)
      this.gaps.pop()
    }
    this.next = at + bytes
    return at
  }

  private reach(end: number): void {
    const pages = this.memory.buffer.byteLength / PAGE_BYTES
    const needed = Math.ceil(end / PAGE_BYTES) - pages
    if (needed <= 0) return
    const ahead = Math.min(GROWN_AHEAD_PAGES, MAXIMUM_PAGES - pages)
    try {
      this.memory.grow(Math.max(needed, ahead))
    } catch (error) {
      if (ahead <= needed) throw error
      this.memory.grow(needed)
    }
  }

  /** Makes one of the gap at `index` and the next, where they touch. */
  private join(index: number): void {
    const gap = this.gaps[index]
    const after = this.gaps.at(index + 1)
    if (after?.at !== gap.at + gap.bytes) return
    gap.bytes += after.bytes
    this.gaps.splice(index + 1, 1)
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
  // Where a resting room leads: nowhere. A browser may go on calling a worklet that has no output connected at
  // all, as it would one whose work is done for its own sake; one that leads to what is not heard is left alone.
  private deadEnd: GainNode | null = null

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
    const memory = new WebAssembly.Memory({
      initial: 16,
      maximum: MAXIMUM_PAGES,
      shared: true,
    })
    return new SpaceKernel(context, module, memory, options)
  }

  /** A convolution with `impulse`, or null for an impulse it does not take (it takes two channels at the context's own rate) and where there is no room for it. */
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
    // One that no room was left of while it was wanted.
    for (const left of this.impulses.filter(({ rooms }) => rooms === 0)) this.drop(left)
    this.refill()
  }

  dispose(): void {
    this.disposed = true
    for (const spare of this.spares.splice(0)) spare.convolver.dispose()
  }

  /** Whether it takes an impulse: one of two channels at the rate of its context. */
  takes(impulse: AudioBuffer): boolean {
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
      const convolver = this.build(impulse)
      if (!convolver) return
      this.spares.push({ buffer: impulse, convolver })
      this.refill()
    }, 0)
  }

  /** A room of `buffer`, or null where the memory has no place for it or its node can not be made. Nothing is left of one that failed. */
  private build(buffer: AudioBuffer): RoomConvolver | null {
    const held: number[] = []
    let impulse: Impulse | null = null
    try {
      impulse = this.impulse(buffer)
      impulse.rooms += 1
      return this.lay(impulse, held)
    } catch {
      for (const at of held) this.ground.back(at)
      if (impulse) this.letGo(impulse)
      return null
    }
  }

  /** Lays a room out, with what it takes of the memory added to `held`. */
  private lay(impulse: Impulse, held: number[]): RoomConvolver {
    const { ground, exports } = this
    const take = (count: number): number => {
      const at = ground.floats(count)
      held.push(at)
      return at
    }
    const room = take(exports.room_bytes() / 4)
    const last = SPACE_PARTITIONS[SPACE_PARTITIONS.length - 1]
    exports.room_init(room, Math.ceil((impulse.buffer.length + 3 * last) / SPACE_ROOM_QUANTUM) + 1)
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
    // Open while the room sounds: its value is 0 and the node's second output is added to it.
    const gate = this.context.createGain()
    gate.gain.automationRate = 'k-rate'
    gate.gain.value = 0
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
        node.connect((this.deadEnd ??= this.context.createGain()), 0)
        return true
      },
      wake: () => {
        if (over || !resting) return
        resting = false
        node.disconnect()
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
    const taken: number[] = []
    const take = (count: number): number => {
      const at = ground.floats(count)
      taken.push(at)
      return at
    }
    const spectraOf = ({ size, from, partitions }: SpacePartition): number => {
      const tables = this.table(size)
      const at = take(2 * partitions * 2 * size)
      const samples = take(2 * size)
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
    }
    let spectra: number[]
    try {
      spectra = cut.map(spectraOf)
    } catch (error) {
      for (const at of taken) ground.back(at)
      throw error
    }
    const impulse: Impulse = { buffer, cut, spectra, rooms: 0 }
    this.impulses.push(impulse)
    return impulse
  }

  /** A room of `impulse` is gone; the last of one that is not wanted any more takes its spectra with it. */
  private letGo(impulse: Impulse): void {
    impulse.rooms -= 1
    if (impulse.rooms === 0) this.drop(impulse)
  }

  private drop(impulse: Impulse): void {
    if (impulse.buffer === this.wanted) return
    for (const at of impulse.spectra) this.ground.back(at)
    this.impulses.splice(this.impulses.indexOf(impulse), 1)
  }
}
