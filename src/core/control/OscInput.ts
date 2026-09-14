// OSC over WebSocket as a `ControlInput`. Browsers have no UDP, so a bridge
// (TouchOSC Bridge, `osc-js` relay, a tiny Node script) forwards OSC packets
// over a WebSocket as binary frames; `OscInput` decodes them (messages and
// bundles) and publishes one control event per numeric or boolean argument.
// The transport is injectable — pass any object with `subscribe` — so tests
// and non-WebSocket hosts never touch the global. Malformed packets are
// dropped and counted, never thrown at the caller.

import { Emitter } from '../events'
import { type ControlInput } from './ControlSurface'
import { type ControlEvent } from './event'
import {
  OscDecodeError,
  controlEventsFromOsc,
  decodeOscPacket,
  flattenOscPacket,
  type OscMessage,
} from './osc'

export type OscPacketBytes = ArrayBuffer | Uint8Array

/** Anything that delivers OSC packets: a WebSocket wrapper, WebRTC data channel, a test. */
export interface OscTransport {
  subscribe(listener: (packet: OscPacketBytes) => void): () => void
  close?(): void
}

/** The slice of `WebSocket` the default transport uses. */
export interface WebSocketLike {
  binaryType: string
  readyState: number
  onopen: ((event: unknown) => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onerror: ((event: unknown) => void) | null
  onclose: ((event: unknown) => void) | null
  close(): void
}

export type WebSocketFactory = (url: string) => WebSocketLike

export interface OscInputOptions {
  /** WebSocket URL of the OSC bridge (`ws://localhost:8080`). */
  url?: string
  /** A ready transport instead of a WebSocket. */
  transport?: OscTransport
  /** Defaults to `new WebSocket(url)`; inject for tests. */
  createSocket?: WebSocketFactory
}

const WEBSOCKET_OPEN = 1

/** True when the environment has `WebSocket`. */
export function isWebSocketSupported(): boolean {
  return typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'function'
}

function defaultSocketFactory(): WebSocketFactory {
  return (url) => {
    if (!isWebSocketSupported()) {
      throw new Error('live-mix: WebSocket is not available in this environment')
    }
    const Socket = (globalThis as unknown as { WebSocket: new (url: string) => WebSocketLike })
      .WebSocket
    return new Socket(url)
  }
}

/** A transport over one WebSocket; resolves `ready` on open, rejects on error before open. */
export function webSocketTransport(
  url: string,
  createSocket: WebSocketFactory = defaultSocketFactory(),
): OscTransport & { ready: Promise<void>; socket: WebSocketLike } {
  const socket = createSocket(url)
  socket.binaryType = 'arraybuffer'
  const packets = new Emitter<OscPacketBytes>()
  const ready = new Promise<void>((resolve, reject) => {
    if (socket.readyState === WEBSOCKET_OPEN) resolve()
    socket.onopen = () => resolve()
    socket.onerror = () => reject(new Error(`live-mix: OSC WebSocket ${url} failed to connect`))
  })
  socket.onmessage = (event) => {
    const { data } = event
    if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      packets.emit(data)
    } else if (isBlobLike(data)) {
      void data.arrayBuffer().then((buffer) => packets.emit(buffer))
    }
    // Text frames are not OSC; ignored.
  }
  return {
    ready,
    socket,
    subscribe: (listener) => packets.subscribe(listener),
    close: () => {
      socket.onmessage = null
      socket.onopen = null
      socket.onerror = null
      socket.close()
    },
  }
}

function isBlobLike(value: unknown): value is { arrayBuffer(): Promise<ArrayBuffer> } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { arrayBuffer?: unknown }).arrayBuffer === 'function'
  )
}

export class OscInput implements ControlInput {
  private readonly url: string | null
  private readonly createSocket: WebSocketFactory
  private readonly events = new Emitter<ControlEvent>()
  private readonly messages = new Emitter<OscMessage>()
  private readonly errors = new Emitter<Error>()
  private transport: OscTransport | null
  private detach: (() => void) | null = null
  private opening: Promise<void> | null = null
  private droppedCount = 0

  constructor(options: OscInputOptions = {}) {
    this.url = options.url ?? null
    this.createSocket = options.createSocket ?? defaultSocketFactory()
    this.transport = options.transport ?? null
    if (this.transport) this.attach(this.transport)
  }

  static isSupported(): boolean {
    return isWebSocketSupported()
  }

  /** Connect the WebSocket (when built with a `url`) or confirm the injected transport. Idempotent. */
  open(): Promise<void> {
    this.opening ??= this.start()
    return this.opening
  }

  get opened(): boolean {
    return this.detach !== null
  }

  /** Packets that failed to decode since construction. */
  get dropped(): number {
    return this.droppedCount
  }

  subscribe(listener: (event: ControlEvent) => void): () => void {
    return this.events.subscribe(listener)
  }

  /** Every decoded message, bundles flattened, before mapping. */
  onMessage(listener: (message: OscMessage) => void): () => void {
    return this.messages.subscribe(listener)
  }

  /** Decode failures (the packet is dropped either way). */
  onError(listener: (error: Error) => void): () => void {
    return this.errors.subscribe(listener)
  }

  /** Decode and publish one packet, as if the transport delivered it. Returns the control events. */
  feed(packet: OscPacketBytes): ControlEvent[] {
    let messages: OscMessage[]
    try {
      messages = flattenOscPacket(decodeOscPacket(packet))
    } catch (error) {
      this.droppedCount += 1
      this.errors.emit(
        error instanceof OscDecodeError ? error : new Error('live-mix: malformed OSC packet'),
      )
      return []
    }
    const events: ControlEvent[] = []
    for (const message of messages) {
      this.messages.emit(message)
      for (const event of controlEventsFromOsc(message)) {
        events.push(event)
        this.events.emit(event)
      }
    }
    return events
  }

  close(): void {
    this.detach?.()
    this.detach = null
    this.transport?.close?.()
    if (this.url) this.transport = null
    this.opening = null
  }

  private async start(): Promise<void> {
    if (this.transport) {
      if (!this.detach) this.attach(this.transport)
      return
    }
    if (!this.url) throw new Error('live-mix: OscInput needs a url or a transport')
    const transport = webSocketTransport(this.url, this.createSocket)
    this.transport = transport
    this.attach(transport)
    try {
      await transport.ready
    } catch (error) {
      this.close()
      throw error
    }
  }

  private attach(transport: OscTransport): void {
    this.detach = transport.subscribe((packet) => {
      this.feed(packet)
    })
  }
}
