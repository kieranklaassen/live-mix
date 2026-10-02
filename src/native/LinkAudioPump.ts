// The Link Audio pump's work, apart from the worker scope it runs in: stamp
// each block the tap posts with when it is heard on the host's clock and send
// it to the host. A block that cannot be sent now is dropped.

import {
  LINK_AUDIO_MAX_QUEUED_BYTES,
  encodeLinkAudioBlock,
  linkAudioBlockMicros,
  type LinkAudioClock,
  type LinkAudioStats,
  type LinkTapBlock,
} from './link-audio-protocol'

/** The slice of `WebSocket` the pump uses. */
export interface LinkAudioSocket {
  binaryType: string
  readyState: number
  bufferedAmount: number
  onopen: ((event: unknown) => void) | null
  onclose: ((event: { reason?: string }) => void) | null
  onerror: ((event: unknown) => void) | null
  send(data: ArrayBuffer): void
  close(): void
}

export interface LinkAudioPumpOptions {
  socket: LinkAudioSocket
  sampleRate: number
  onOpen?: () => void
  onClose?: (reason: string) => void
}

const SOCKET_OPEN = 1

export class LinkAudioPump {
  private readonly socket: LinkAudioSocket
  private readonly sampleRate: number
  private clock: LinkAudioClock | null = null
  private blocks = 0
  private dropped = 0
  private closed = false

  constructor(options: LinkAudioPumpOptions) {
    this.socket = options.socket
    this.sampleRate = options.sampleRate
    this.socket.binaryType = 'arraybuffer'
    this.socket.onopen = () => options.onOpen?.()
    const finish = (reason: string) => {
      if (this.closed) return
      this.closed = true
      options.onClose?.(reason)
    }
    this.socket.onclose = (event) => {
      const reason = event.reason ?? ''
      finish(reason === '' ? 'the plug-in host closed the channel' : reason)
    }
    this.socket.onerror = () => finish('the connection to the plug-in host failed')
  }

  /** When a context time is heard on the host's clock, as the main thread last measured it. */
  setClock(clock: LinkAudioClock): void {
    this.clock = clock
  }

  /** One block from the tap. */
  send(block: LinkTapBlock): void {
    if (
      this.closed ||
      this.clock === null ||
      this.socket.readyState !== SOCKET_OPEN ||
      this.socket.bufferedAmount > LINK_AUDIO_MAX_QUEUED_BYTES
    ) {
      this.dropped += 1
      return
    }
    const at = linkAudioBlockMicros(block, this.sampleRate, this.clock)
    this.socket.send(encodeLinkAudioBlock(block, this.sampleRate, at))
    this.blocks += 1
  }

  /** Blocks sent and dropped since this was last asked. */
  takeStats(): LinkAudioStats {
    const stats = { blocks: this.blocks, dropped: this.dropped }
    this.blocks = 0
    this.dropped = 0
    return stats
  }

  stop(): void {
    this.closed = true
    this.socket.close()
  }
}
