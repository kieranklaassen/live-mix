// The pump between the bridge's shared memory and the plug-in host. It runs
// in a worker (`native-pump.worker.ts`), because it both sleeps on the
// worklet's write counter and owns a socket: neither is possible in the
// worklet, and the main thread is too busy to keep an audio deadline.
//
// Outbound: whenever the worklet has written frames the host has not seen,
// send them, at most `BRIDGE_MAX_BLOCK_FRAMES` per message. Inbound: every
// reply is the processed audio for the oldest unanswered block; write it into
// the output ring at that block's frame index and publish the new ready mark.

import {
  BRIDGE_ACTIVE,
  BRIDGE_MAX_BLOCK_FRAMES,
  BRIDGE_READY,
  BRIDGE_UNDERRUNS,
  BRIDGE_WRITTEN,
  HOST_HEADER_BYTES,
  HOST_MESSAGE_MIDI,
  HOST_MESSAGE_PROCESS,
  clearRing,
  frameDistance,
  readRing,
  writeRing,
  type BridgeMemory,
  type PumpStats,
} from './bridge-protocol'

/** The slice of `WebSocket` the pump uses. */
export interface PumpSocket {
  binaryType: string
  readyState: number
  onopen: ((event: unknown) => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onclose: ((event: { reason?: string; code?: number }) => void) | null
  onerror: ((event: unknown) => void) | null
  send(data: ArrayBuffer): void
  close(): void
}

export interface BridgePumpOptions {
  memory: BridgeMemory
  socket: PumpSocket
  onOpen?: () => void
  onClose?: (reason: string) => void
  /** Milliseconds, for round-trip statistics; defaults to `performance.now`. */
  now?: () => number
}

interface SentBlock {
  index: number
  frames: number
  sentAt: number
}

type WaitAsync = (
  array: Int32Array,
  index: number,
  value: number,
) => { async: boolean; value: Promise<unknown> | string }

const SOCKET_OPEN = 1

function nonEmpty(text: string | undefined): string | undefined {
  return text === '' ? undefined : text
}

export class BridgePump {
  private readonly control: Int32Array
  private readonly input: Float32Array
  private readonly output: Float32Array
  private readonly memory: BridgeMemory
  private readonly socket: PumpSocket
  private readonly now: () => number
  private readonly onClose: ((reason: string) => void) | undefined
  private readonly pending: SentBlock[] = []
  private readonly outgoing = new Map<number, ArrayBuffer>()
  private readonly scratch: Float32Array
  private sent = 0
  private sequence = 0
  private running = false
  private closed = false
  private blocks = 0
  private roundTripSum = 0
  private roundTripMax = 0
  private droppedFrames = 0

  constructor(options: BridgePumpOptions) {
    this.memory = options.memory
    this.control = new Int32Array(options.memory.control)
    this.input = new Float32Array(options.memory.input)
    this.output = new Float32Array(options.memory.output)
    this.socket = options.socket
    this.now = options.now ?? (() => performance.now())
    this.onClose = options.onClose
    this.scratch = new Float32Array(BRIDGE_MAX_BLOCK_FRAMES)

    const socket = this.socket
    socket.binaryType = 'arraybuffer'
    socket.onopen = () => {
      this.begin()
      options.onOpen?.()
    }
    socket.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) this.receive(event.data)
    }
    socket.onclose = (event) =>
      this.finish(nonEmpty(event.reason) ?? 'the plug-in host closed the connection')
    socket.onerror = () => this.finish('the connection to the plug-in host failed')
    if (socket.readyState === SOCKET_OPEN) {
      this.begin()
      options.onOpen?.()
    }
  }

  /** One MIDI message for the start of the next block the host processes. */
  midi(bytes: readonly number[]): void {
    if (!this.running || bytes.length === 0) return
    const message = new ArrayBuffer(HOST_HEADER_BYTES + Math.ceil(bytes.length / 4) * 4)
    new Uint32Array(message, 0, 4).set([HOST_MESSAGE_MIDI, bytes.length, 0, 0])
    new Uint8Array(message, HOST_HEADER_BYTES).set(bytes)
    this.socket.send(message)
  }

  /** Round-trip figures since the last call, and the running counters. */
  takeStats(): PumpStats {
    const stats: PumpStats = {
      blocks: this.blocks,
      roundTripMeanMs: this.blocks > 0 ? this.roundTripSum / this.blocks : 0,
      roundTripMaxMs: this.roundTripMax,
      underruns: Atomics.load(this.control, BRIDGE_UNDERRUNS),
      droppedFrames: this.droppedFrames,
    }
    this.blocks = 0
    this.roundTripSum = 0
    this.roundTripMax = 0
    return stats
  }

  stop(): void {
    this.finish('stopped')
    this.socket.close()
  }

  /**
   * Send every frame the worklet has written since the last call. Returns the
   * number of frames sent. `run` calls this whenever the write counter moves;
   * tests call it directly.
   */
  flush(): number {
    if (!this.running) return 0
    const { ringFrames, inputChannels } = this.memory
    const written = Atomics.load(this.control, BRIDGE_WRITTEN)
    let available = frameDistance(written, this.sent)
    if (available <= 0) return 0

    // A whole ring behind: the oldest input is already overwritten. Skip to
    // the newest block; `receive` plays the skipped stretch as silence.
    if (available > ringFrames - BRIDGE_MAX_BLOCK_FRAMES) {
      const keep = Math.min(BRIDGE_MAX_BLOCK_FRAMES, available)
      this.droppedFrames += available - keep
      this.sent = (written - keep) | 0
      available = keep
    }

    let total = 0
    while (available > 0) {
      const frames = Math.min(available, BRIDGE_MAX_BLOCK_FRAMES)
      const message = this.messageFor(frames)
      new Uint32Array(message, 0, 4).set([
        HOST_MESSAGE_PROCESS,
        frames,
        inputChannels,
        this.sequence >>> 0,
      ])
      const payload = new Float32Array(message, HOST_HEADER_BYTES)
      for (let channel = 0; channel < inputChannels; channel += 1) {
        readRing(this.input, ringFrames, channel, this.sent, payload, channel * frames, frames)
      }
      this.socket.send(message)
      this.pending.push({ index: this.sent, frames, sentAt: this.now() })
      this.sequence = (this.sequence + 1) | 0
      this.sent = (this.sent + frames) | 0
      available -= frames
      total += frames
    }
    return total
  }

  /**
   * Sleep on the write counter and flush whenever it moves, until the socket
   * closes. Between wake-ups the worker's event loop delivers the replies.
   */
  async run(): Promise<void> {
    const waitAsync = (Atomics as unknown as { waitAsync?: WaitAsync }).waitAsync
    if (typeof waitAsync !== 'function') {
      this.finish('this browser has no Atomics.waitAsync')
      this.socket.close()
      return
    }
    while (!this.closed) {
      if (!this.running) {
        await new Promise((resolve) => setTimeout(resolve, 5))
        continue
      }
      const written = Atomics.load(this.control, BRIDGE_WRITTEN)
      if (written !== this.sent) {
        this.flush()
        continue
      }
      const wait = waitAsync(this.control, BRIDGE_WRITTEN, written)
      if (wait.async) await wait.value
    }
  }

  private begin(): void {
    if (this.closed || this.running) return
    const { ringFrames, outputChannels } = this.memory
    this.sent = Atomics.load(this.control, BRIDGE_WRITTEN)
    for (let channel = 0; channel < outputChannels; channel += 1) {
      clearRing(this.output, ringFrames, channel, 0, ringFrames)
    }
    Atomics.store(this.control, BRIDGE_READY, this.sent)
    Atomics.store(this.control, BRIDGE_ACTIVE, 1)
    this.running = true
    // Wake `run` if it is asleep on a counter that will not move while audio is stopped.
    Atomics.notify(this.control, BRIDGE_WRITTEN)
  }

  private receive(message: ArrayBuffer): void {
    if (!this.running || message.byteLength < HOST_HEADER_BYTES) return
    const [type, frames, channels] = new Uint32Array(message, 0, 4)
    if (type !== HOST_MESSAGE_PROCESS) return
    const block = this.pending.shift()
    if (block?.frames !== frames) {
      this.finish('the plug-in host answered out of step')
      this.socket.close()
      return
    }
    const { ringFrames, outputChannels } = this.memory
    const payload = new Float32Array(message, HOST_HEADER_BYTES)

    // Frames dropped before this block never reach the host: they play as silence.
    const gap = frameDistance(block.index, Atomics.load(this.control, BRIDGE_READY))
    if (gap > 0) {
      for (let channel = 0; channel < outputChannels; channel += 1) {
        clearRing(
          this.output,
          ringFrames,
          channel,
          block.index - Math.min(gap, ringFrames),
          Math.min(gap, ringFrames),
        )
      }
    }
    for (let channel = 0; channel < outputChannels; channel += 1) {
      const from = Math.min(channel, channels - 1)
      if (from < 0) {
        clearRing(this.output, ringFrames, channel, block.index, frames)
      } else {
        this.scratch.set(payload.subarray(from * frames, (from + 1) * frames))
        writeRing(this.output, ringFrames, channel, block.index, this.scratch, 0, frames)
      }
    }
    Atomics.store(this.control, BRIDGE_READY, (block.index + frames) | 0)
    // An offline render waits on this mark between stretches (`offline.ts`).
    Atomics.notify(this.control, BRIDGE_READY)

    const elapsed = this.now() - block.sentAt
    this.blocks += 1
    this.roundTripSum += elapsed
    if (elapsed > this.roundTripMax) this.roundTripMax = elapsed
  }

  private finish(reason: string): void {
    if (this.closed) return
    this.closed = true
    this.running = false
    Atomics.store(this.control, BRIDGE_ACTIVE, 0)
    Atomics.notify(this.control, BRIDGE_WRITTEN)
    Atomics.notify(this.control, BRIDGE_READY)
    this.pending.length = 0
    this.onClose?.(reason)
  }

  /** One reusable message buffer per block size; `send` copies it. */
  private messageFor(frames: number): ArrayBuffer {
    let message = this.outgoing.get(frames)
    if (!message) {
      message = new ArrayBuffer(
        HOST_HEADER_BYTES + frames * this.memory.inputChannels * Float32Array.BYTES_PER_ELEMENT,
      )
      this.outgoing.set(frames, message)
    }
    return message
  }
}
