// The Link Audio tap: what passes through this node is copied into blocks and
// posted to the pump worker. All the work is in `LinkAudioTap`; this file is
// its AudioWorkletGlobalScope wrapper, bundled to a single self-contained
// file (dist/worklets/link-tap.js). A sink: it has no output.

import { LinkAudioTap } from '../LinkAudioTap'
import {
  LINK_TAP_PROCESSOR_NAME,
  type LinkTapMessage,
  type LinkTapProcessorOptions,
} from '../link-audio-protocol'

class LinkTapProcessor extends AudioWorkletProcessor {
  private readonly tap: LinkAudioTap
  private pump: MessagePort | null = null
  private running = true

  constructor(options?: AudioWorkletNodeOptions) {
    super()
    const processorOptions = (options?.processorOptions ?? {}) as Partial<LinkTapProcessorOptions>
    this.tap = new LinkAudioTap(
      { channels: processorOptions.channels ?? 2, blockFrames: processorOptions.blockFrames },
      (block) => this.pump?.postMessage(block, [block.samples.buffer]),
    )
    this.port.onmessage = (event: MessageEvent<LinkTapMessage>) => {
      if (event.data.type === 'port') this.pump = event.data.port
      else if (event.data.type === 'dispose') this.running = false
    }
  }

  process(inputs: Float32Array[][]): boolean {
    if (!this.running) return false
    const input = inputs[0] ?? []
    this.tap.process(input, currentFrame, input[0]?.length ?? 128)
    return true
  }
}

registerProcessor(LINK_TAP_PROCESSOR_NAME, LinkTapProcessor)
