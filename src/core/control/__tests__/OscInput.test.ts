import { describe, expect, it, vi } from 'vitest'

import { type ControlEvent } from '../event'
import { OSC_IMMEDIATELY, encodeOscBundle, encodeOscMessage, type OscMessage } from '../osc'
import {
  OscInput,
  isWebSocketSupported,
  webSocketTransport,
  type OscTransport,
  type WebSocketLike,
} from '../OscInput'

class FakeSocket implements WebSocketLike {
  binaryType = 'blob'
  readyState = 0
  onopen: ((event: unknown) => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onclose: ((event: unknown) => void) | null = null
  closed = 0
  constructor(readonly url: string) {}

  open(): void {
    this.readyState = 1
    this.onopen?.({})
  }

  fail(): void {
    this.onerror?.({})
  }

  deliver(data: unknown): void {
    this.onmessage?.({ data })
  }

  close(): void {
    this.closed += 1
    this.readyState = 3
  }
}

function fakeTransport(): OscTransport & { push(packet: Uint8Array): void; closed: number } {
  const listeners = new Set<(packet: Uint8Array) => void>()
  return {
    closed: 0,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    close() {
      this.closed += 1
    },
    push(packet) {
      for (const listener of listeners) listener(packet)
    },
  }
}

const fader = (value: number): Uint8Array =>
  encodeOscMessage({ address: '/1/fader1', args: [{ type: 'f', value }] })

describe('OscInput', () => {
  it('decodes packets from an injected transport into messages and control events', async () => {
    const transport = fakeTransport()
    const input = new OscInput({ transport })
    const events: ControlEvent[] = []
    const messages: OscMessage[] = []
    input.subscribe((event) => events.push(event))
    input.onMessage((message) => messages.push(message))
    await input.open()
    expect(input.opened).toBe(true)

    transport.push(fader(0.25))
    transport.push(
      encodeOscBundle({
        timeTag: OSC_IMMEDIATELY,
        elements: [
          { address: '/1/toggle1', args: [{ type: 'T' }] },
          { address: '/2/go', args: [] },
        ],
      }),
    )
    expect(messages.map((message) => message.address)).toEqual(['/1/fader1', '/1/toggle1', '/2/go'])
    expect(events).toEqual([
      {
        kind: 'absolute',
        source: { kind: 'osc', address: '/1/fader1', arg: 0 },
        value: 0.25,
        raw: 0.25,
      },
      {
        kind: 'trigger',
        source: { kind: 'osc', address: '/1/toggle1', arg: 0 },
        on: true,
        value: 1,
      },
      { kind: 'trigger', source: { kind: 'osc', address: '/2/go', arg: 0 }, on: true, value: 1 },
    ])

    input.close()
    expect(transport.closed).toBe(1)
    transport.push(fader(0.5))
    expect(events).toHaveLength(3)
  })

  it('drops malformed packets, counts them and reports them without throwing', () => {
    const transport = fakeTransport()
    const input = new OscInput({ transport })
    const errors: string[] = []
    input.onError((error) => errors.push(error.message))
    expect(input.feed(Uint8Array.from([0x2f, 0x61, 0x00]))).toEqual([])
    transport.push(Uint8Array.from([1, 2, 3, 4]))
    expect(input.dropped).toBe(2)
    expect(errors).toHaveLength(2)
    expect(errors[0]).toMatch(/malformed OSC packet/)
    expect(input.feed(fader(1))).toHaveLength(1)
    expect(input.dropped).toBe(2)
  })

  it('connects a WebSocket through the injected factory, sets binaryType and resolves on open', async () => {
    let socket: FakeSocket | null = null
    const input = new OscInput({
      url: 'ws://localhost:8080',
      createSocket: (url) => (socket = new FakeSocket(url)),
    })
    const events: ControlEvent[] = []
    input.subscribe((event) => events.push(event))
    const opening = input.open()
    if (!socket) throw new Error('socket not created')
    const created: FakeSocket = socket
    expect(created.url).toBe('ws://localhost:8080')
    expect(created.binaryType).toBe('arraybuffer')
    created.open()
    await opening
    expect(input.opened).toBe(true)

    const packet = fader(0.75)
    created.deliver(packet.buffer.slice(packet.byteOffset, packet.byteOffset + packet.byteLength))
    created.deliver(packet)
    created.deliver('not osc')
    expect(events).toHaveLength(2)

    // Blob frames are read asynchronously.
    created.deliver({ arrayBuffer: () => Promise.resolve(packet.buffer.slice(0)) })
    await Promise.resolve()
    await Promise.resolve()
    expect(events).toHaveLength(3)

    input.close()
    expect(created.closed).toBe(1)
    created.deliver(packet)
    expect(events).toHaveLength(3)
  })

  it('rejects open() when the socket errors before opening and closes it', async () => {
    let socket: FakeSocket | null = null
    const input = new OscInput({
      url: 'ws://nowhere',
      createSocket: (url) => (socket = new FakeSocket(url)),
    })
    const opening = input.open()
    if (!socket) throw new Error('socket not created')
    const created: FakeSocket = socket
    created.fail()
    await expect(opening).rejects.toThrow(/failed to connect/)
    expect(created.closed).toBe(1)
    expect(input.opened).toBe(false)
  })

  it('needs a url or a transport, and resolves at once for an already-open socket', async () => {
    await expect(new OscInput().open()).rejects.toThrow(/needs a url or a transport/)
    const socket = new FakeSocket('ws://x')
    socket.readyState = 1
    const transport = webSocketTransport('ws://x', () => socket)
    await expect(transport.ready).resolves.toBeUndefined()
    expect(transport.socket).toBe(socket)
  })

  it('reports WebSocket support from the global', () => {
    expect(isWebSocketSupported()).toBe(typeof WebSocket === 'function')
    expect(OscInput.isSupported()).toBe(isWebSocketSupported())
  })

  it('uses the injected factory without a global; the default factory throws where WebSocket is missing', async () => {
    const original = (globalThis as { WebSocket?: unknown }).WebSocket
    vi.stubGlobal('WebSocket', undefined)
    try {
      expect(isWebSocketSupported()).toBe(false)
      await expect(new OscInput({ url: 'ws://x' }).open()).rejects.toThrow(
        /WebSocket is not available/,
      )
    } finally {
      vi.stubGlobal('WebSocket', original)
      vi.unstubAllGlobals()
    }
  })
})
