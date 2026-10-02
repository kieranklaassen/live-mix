// The Link Audio playout: a peer's channel comes out of this node. All the
// work is in `LinkAudioPlayout`; this file is its AudioWorkletGlobalScope
// wrapper, bundled to a single self-contained file
// (dist/worklets/link-source.js). A source: it has no input.

import { LinkAudioPlayout } from '../LinkAudioPlayout'
import {
  LINK_SOURCE_PROCESSOR_NAME,
  type LinkReceivedBlock,
  type LinkSourceMessage,
  type LinkSourceProcessorOptions,
} from '../link-receive-protocol'

const QUANTUM_FRAMES = 128

class LinkSourceProcessor extends AudioWorkletProcessor {
  private readonly playout: LinkAudioPlayout
  private running = true
  /** The context frame the next quantum starts at: blocks arrive between quanta. */
  private nextFrame = currentFrame
  private readonly spare = new Float32Array(QUANTUM_FRAMES)

  constructor(options?: AudioWorkletNodeOptions) {
    super()
    const processorOptions = (options?.processorOptions ?? {}) as LinkSourceProcessorOptions
    this.playout = new LinkAudioPlayout(
      { sampleRate, delaySec: processorOptions.delaySec ?? null },
      (event) => this.port.postMessage(event),
    )
    this.port.onmessage = (event: MessageEvent<LinkSourceMessage>) => {
      const message = event.data
      if (message.type === 'port') {
        message.port.onmessage = (block: MessageEvent<LinkReceivedBlock>) => {
          this.playout.push(block.data, Math.max(this.nextFrame, currentFrame) / sampleRate)
        }
      } else if (message.type === 'dispose') {
        this.running = false
      }
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (!this.running) return false
    const output = outputs[0] ?? []
    const left = output[0]
    if (!left) return true
    this.nextFrame = currentFrame + left.length
    this.playout.process(left, output[1] ?? this.spare.subarray(0, left.length), currentFrame)
    return true
  }
}

registerProcessor(LINK_SOURCE_PROCESSOR_NAME, LinkSourceProcessor)
