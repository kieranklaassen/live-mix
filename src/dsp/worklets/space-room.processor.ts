// AudioWorklet processor of a track's room (`core/tracks/SpaceKernel.ts`).
// The page has laid the room out in a memory this thread shares with it; all
// there is to do here is to run it.
//
// The second output says whether there is anything in the first: a constant
// 1 while the room sounds, and nothing once it has rung out. A worklet cannot
// tell the nodes after it that a block is silent, and they would go on
// working on zeros. The host hangs a gain after the first output that the
// second one opens, and a gain of nothing does tell them.
//
// This file runs in the AudioWorkletGlobalScope and is bundled to a single
// self-contained file (dist/worklets/space-room.js).

import {
  SPACE_ROOM_PROCESSOR_NAME,
  SPACE_ROOM_QUANTUM,
  type SpaceRoomExports,
  type SpaceRoomHostMessage,
  type SpaceRoomProcessorOptions,
} from '../../core/tracks/space-kernel-abi'

// One instance on this thread for each memory: an engine's rooms all lie in one.
const instances = new WeakMap<WebAssembly.Memory, SpaceRoomExports>()

function instanceOn(memory: WebAssembly.Memory, module: WebAssembly.Module): SpaceRoomExports {
  let exports = instances.get(memory)
  if (!exports) {
    exports = new WebAssembly.Instance(module, { env: { memory } })
      .exports as unknown as SpaceRoomExports
    instances.set(memory, exports)
  }
  return exports
}

class SpaceRoomProcessor extends AudioWorkletProcessor {
  private readonly kernel: SpaceRoomExports
  private readonly room: number
  private readonly in: readonly [Float32Array, Float32Array]
  private readonly out: readonly [Float32Array, Float32Array]
  private ended = false

  constructor(options?: AudioWorkletNodeOptions) {
    super()
    const { module, memory, room } = options?.processorOptions as SpaceRoomProcessorOptions
    const exports = instanceOn(memory, module)
    this.kernel = exports
    this.room = room
    const pair = (at: number): [Float32Array, Float32Array] => [
      new Float32Array(memory.buffer, at, SPACE_ROOM_QUANTUM),
      new Float32Array(memory.buffer, at + SPACE_ROOM_QUANTUM * 4, SPACE_ROOM_QUANTUM),
    ]
    this.in = pair(exports.room_in(room))
    this.out = pair(exports.room_out(room))
    this.port.onmessage = () => {
      this.ended = true
      const answer: SpaceRoomHostMessage = 'ended'
      this.port.postMessage(answer)
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (this.ended) return false
    const input = inputs[0]
    const left = input[0]
    if (left) {
      this.in[0].set(left)
      this.in[1].set(input[1] ?? left)
    } else {
      this.in[0].fill(0)
      this.in[1].fill(0)
    }
    // What is left unwritten is silence.
    if (this.kernel.room_process(this.room) === 0) return true
    outputs[0][0].set(this.out[0])
    outputs[0][1].set(this.out[1])
    outputs[1][0].fill(1)
    return true
  }
}

registerProcessor(SPACE_ROOM_PROCESSOR_NAME, SpaceRoomProcessor)
