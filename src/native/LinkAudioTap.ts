// The Link Audio tap's work, apart from the worklet scope it runs in: copy
// each render quantum into an interleaved block and hand over every block
// that fills, with the context frame it began at.

import { LINK_AUDIO_BLOCK_FRAMES, type LinkTapBlock } from './link-audio-protocol'

export class LinkAudioTap {
  private readonly channels: number
  private readonly blockFrames: number
  private readonly emit: (block: LinkTapBlock) => void
  private samples: Float32Array
  private filled = 0
  private startFrame = 0

  constructor(
    options: { channels: number; blockFrames?: number },
    emit: (block: LinkTapBlock) => void,
  ) {
    this.channels = options.channels === 1 ? 1 : 2
    this.blockFrames = Math.max(1, options.blockFrames ?? LINK_AUDIO_BLOCK_FRAMES)
    this.emit = emit
    this.samples = new Float32Array(this.blockFrames * this.channels)
  }

  /**
   * One render quantum. `input` is the node's first input (empty when nothing
   * is connected, which is sent as silence so the stream keeps its time);
   * `frame` is the context frame of its first sample.
   */
  process(input: readonly Float32Array[], frame: number, frames: number): void {
    let done = 0
    while (done < frames) {
      if (this.filled === 0) this.startFrame = frame + done
      const count = Math.min(frames - done, this.blockFrames - this.filled)
      for (let channel = 0; channel < this.channels; channel += 1) {
        // A mono source feeds both sides, as the graph would upmix it.
        const source = input[channel] ?? input[0]
        const to = this.filled * this.channels + channel
        if (source) {
          for (let i = 0; i < count; i += 1) {
            this.samples[to + i * this.channels] = source[done + i]
          }
        } else {
          for (let i = 0; i < count; i += 1) this.samples[to + i * this.channels] = 0
        }
      }
      this.filled += count
      done += count
      if (this.filled === this.blockFrames) this.flush()
    }
  }

  private flush(): void {
    const samples = this.samples
    // The block is given away; the next one needs its own memory.
    this.samples = new Float32Array(this.blockFrames * this.channels)
    this.filled = 0
    this.emit({
      frame: this.startFrame,
      frames: this.blockFrames,
      channels: this.channels,
      samples,
    })
  }
}
