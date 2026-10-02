// The Link Audio intake's work, apart from the worker scope it runs in: read
// each block the host writes, turn the moment it carries into a context time
// and hand it to the playout. A block that arrives before the clocks are
// known is let go: it could not be placed.

import type { LinkAudioClock } from './link-audio-protocol'
import {
  decodeLinkAudioInBlock,
  linkContextTimeAt,
  type LinkReceivedBlock,
} from './link-receive-protocol'

/** The slice of `WebSocket` the intake uses. */
export interface LinkIntakeSocket {
  binaryType: string
  onopen: ((event: unknown) => void) | null
  onclose: ((event: { reason?: string }) => void) | null
  onerror: ((event: unknown) => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  close(): void
}

export interface LinkAudioIntakeOptions {
  socket: LinkIntakeSocket
  /** Where blocks go: the playout's port. */
  deliver: (block: LinkReceivedBlock) => void
  onOpen?: () => void
  onClose?: (reason: string) => void
}

export class LinkAudioIntake {
  private readonly socket: LinkIntakeSocket
  private readonly deliver: (block: LinkReceivedBlock) => void
  private clock: LinkAudioClock | null = null
  private closed = false

  constructor(options: LinkAudioIntakeOptions) {
    this.socket = options.socket
    this.deliver = options.deliver
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
    this.socket.onmessage = ({ data }) => {
      if (data instanceof ArrayBuffer) this.receive(data)
    }
  }

  /** When a context time is heard on the host's clock, as the main thread last measured it. */
  setClock(clock: LinkAudioClock): void {
    this.clock = clock
  }

  /** One message from the host. */
  receive(message: ArrayBuffer): void {
    if (this.closed || this.clock === null) return
    const block = decodeLinkAudioInBlock(message)
    if (!block) return
    const { atMicros, ...rest } = block
    this.deliver({ ...rest, contextTime: linkContextTimeAt(atMicros, this.clock) })
  }

  stop(): void {
    this.closed = true
    this.socket.close()
  }
}
