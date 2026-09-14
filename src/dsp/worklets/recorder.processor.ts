// Capture worklet: copies its input into preallocated chunk buffers and posts
// each full chunk to the main thread (transferring the buffers), so recording
// the master or a track costs one memcpy per render quantum and no
// allocation inside process() beyond the next chunk's typed arrays, which are
// created between chunks. A sink: no outputs.
//
// This file runs in the AudioWorkletGlobalScope and is bundled to a single
// self-contained file (dist/worklets/recorder.js).

import {
  DEFAULT_RECORDER_CHUNK_FRAMES,
  RECORDER_PROCESSOR_NAME,
  type RecorderHostMessage,
  type RecorderMessage,
  type RecorderProcessorOptions,
} from '../../core/render/recorder-protocol'

class RecorderProcessor extends AudioWorkletProcessor {
  private readonly channelCount: number
  private readonly chunkFrames: number
  private chunk: Float32Array[]
  private filled = 0
  private recording = false
  private startAt: number | null = null
  private totalFrames = 0

  constructor(options?: AudioWorkletNodeOptions) {
    super()
    const processorOptions = (options?.processorOptions ?? {}) as Partial<RecorderProcessorOptions>
    this.channelCount = Math.max(1, processorOptions.channelCount ?? 2)
    this.chunkFrames = Math.max(128, processorOptions.chunkFrames ?? DEFAULT_RECORDER_CHUNK_FRAMES)
    this.chunk = this.allocate()
    this.port.onmessage = (event: MessageEvent<RecorderMessage>) => {
      this.handleMessage(event.data)
    }
  }

  private allocate(): Float32Array[] {
    return Array.from({ length: this.channelCount }, () => new Float32Array(this.chunkFrames))
  }

  private handleMessage(message: RecorderMessage): void {
    switch (message.type) {
      case 'start':
        this.recording = true
        this.startAt = message.at ?? null
        break
      case 'stop':
        this.recording = false
        this.flush()
        this.postStopped()
        break
      case 'flush':
        this.flush()
        break
      default: {
        const unhandled: never = message
        throw new Error(`live-mix: unhandled recorder message ${JSON.stringify(unhandled)}`)
      }
    }
  }

  private flush(): void {
    if (this.filled === 0) return
    const frames = this.filled
    const channels = this.chunk.map((channel) => channel.subarray(0, frames))
    const message: RecorderHostMessage = {
      type: 'chunk',
      channels,
      frames,
      startFrame: this.totalFrames - frames,
    }
    this.port.postMessage(
      message,
      channels.map((channel) => channel.buffer),
    )
    this.chunk = this.allocate()
    this.filled = 0
  }

  private postStopped(): void {
    const message: RecorderHostMessage = { type: 'stopped', totalFrames: this.totalFrames }
    this.port.postMessage(message)
  }

  process(inputs: Float32Array[][]): boolean {
    if (!this.recording) return true
    if (this.startAt !== null) {
      if (currentTime < this.startAt) return true
      this.startAt = null
    }
    const input = inputs[0]
    const frames = input?.[0]?.length ?? 128
    let written = 0
    while (written < frames) {
      const room = this.chunkFrames - this.filled
      const count = Math.min(room, frames - written)
      for (let c = 0; c < this.channelCount; c += 1) {
        const source = input?.[Math.min(c, (input?.length ?? 1) - 1)]
        const target = this.chunk[c]
        if (source) {
          target.set(source.subarray(written, written + count), this.filled)
        } else {
          target.fill(0, this.filled, this.filled + count)
        }
      }
      this.filled += count
      written += count
      this.totalFrames += count
      if (this.filled === this.chunkFrames) this.flush()
    }
    return true
  }
}

declare const currentTime: number

registerProcessor(RECORDER_PROCESSOR_NAME, RecorderProcessor)
