import { describe, expect, it } from 'vitest'

import { LinkAudioPump, type LinkAudioSocket } from '../LinkAudioPump'
import { LinkAudioTap } from '../LinkAudioTap'
import {
  HOST_MESSAGE_LINK_AUDIO,
  LINK_AUDIO_HEADER_BYTES,
  LINK_AUDIO_MAX_QUEUED_BYTES,
  encodeLinkAudioBlock,
  linkAudioBlockMicros,
  type LinkTapBlock,
} from '../link-audio-protocol'

const quantum = (value: number, frames = 128) => new Float32Array(frames).fill(value)

describe('LinkAudioTap', () => {
  it('gathers render quanta into interleaved blocks with the frame they began at', () => {
    const blocks: LinkTapBlock[] = []
    const tap = new LinkAudioTap({ channels: 2, blockFrames: 256 }, (block) => blocks.push(block))
    tap.process([quantum(0.1), quantum(-0.1)], 4800, 128)
    expect(blocks).toHaveLength(0)
    tap.process([quantum(0.2), quantum(-0.2)], 4928, 128)
    expect(blocks).toHaveLength(1)
    const [block] = blocks
    expect(block).toMatchObject({ frame: 4800, frames: 256, channels: 2 })
    expect(Array.from(block.samples.slice(0, 4))).toEqual(
      Array.from(new Float32Array([0.1, -0.1, 0.1, -0.1])),
    )
    expect(Array.from(block.samples.slice(256, 260))).toEqual(
      Array.from(new Float32Array([0.2, -0.2, 0.2, -0.2])),
    )
  })

  it('gives every block its own memory', () => {
    const blocks: LinkTapBlock[] = []
    const tap = new LinkAudioTap({ channels: 1, blockFrames: 128 }, (block) => blocks.push(block))
    tap.process([quantum(0.5)], 0, 128)
    tap.process([quantum(0.25)], 128, 128)
    expect(blocks[0].samples.buffer).not.toBe(blocks[1].samples.buffer)
    expect(blocks[0].samples[0]).toBe(0.5)
    expect(blocks[1]).toMatchObject({ frame: 128 })
  })

  it('sends silence while nothing is connected, and a mono source on both sides', () => {
    const blocks: LinkTapBlock[] = []
    const tap = new LinkAudioTap({ channels: 2, blockFrames: 128 }, (block) => blocks.push(block))
    tap.process([quantum(0.9), quantum(0.9)], 0, 128)
    tap.process([], 128, 128)
    tap.process([quantum(0.3)], 256, 128)
    expect(blocks[1].samples.every((sample) => sample === 0)).toBe(true)
    expect(blocks[2].samples[0]).toBeCloseTo(0.3, 6)
    expect(blocks[2].samples[1]).toBeCloseTo(0.3, 6)
  })

  it('carries a block over a quantum that does not divide it', () => {
    const blocks: LinkTapBlock[] = []
    const tap = new LinkAudioTap({ channels: 1, blockFrames: 200 }, (block) => blocks.push(block))
    tap.process([quantum(1)], 0, 128)
    tap.process([quantum(2)], 128, 128)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].frame).toBe(0)
    expect(blocks[0].samples[127]).toBe(1)
    expect(blocks[0].samples[128]).toBe(2)
    tap.process([quantum(3)], 256, 128)
    tap.process([quantum(4)], 384, 128)
    expect(blocks).toHaveLength(2)
    // The second block began 200 frames in, partway through the second quantum.
    expect(blocks[1].frame).toBe(200)
    expect(blocks[1].samples[0]).toBe(2)
  })
})

describe('a Link Audio block on the wire', () => {
  const block: LinkTapBlock = {
    frame: 48_000,
    frames: 2,
    channels: 2,
    samples: new Float32Array([0.5, -0.5, 0.25, -0.25]),
  }

  it('is heard when its first frame is, on the host clock', () => {
    // Context 0.5 s is heard at host 10 000 000 µs; frame 48 000 is context 1 s.
    const clock = { contextTime: 0.5, hostMicros: 10_000_000 }
    expect(linkAudioBlockMicros(block, 48_000, clock)).toBe(10_500_000)
    expect(linkAudioBlockMicros({ frame: 0 }, 48_000, clock)).toBe(9_500_000)
  })

  it('is a header of type, frames, channels and rate, the time, then the samples', () => {
    const message = encodeLinkAudioBlock(block, 44_100, 123_456_789.5)
    expect(message.byteLength).toBe(LINK_AUDIO_HEADER_BYTES + 16)
    expect(Array.from(new Uint32Array(message, 0, 4))).toEqual([
      HOST_MESSAGE_LINK_AUDIO,
      2,
      2,
      44_100,
    ])
    expect(new DataView(message).getFloat64(16, true)).toBe(123_456_789.5)
    expect(Array.from(new Float32Array(message, LINK_AUDIO_HEADER_BYTES))).toEqual([
      0.5, -0.5, 0.25, -0.25,
    ])
  })
})

class FakeAudioSocket implements LinkAudioSocket {
  binaryType = ''
  readyState = 0
  bufferedAmount = 0
  onopen: ((event: unknown) => void) | null = null
  onclose: ((event: { reason?: string }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  readonly sent: ArrayBuffer[] = []
  closed = false
  send(data: ArrayBuffer): void {
    this.sent.push(data)
  }
  close(): void {
    this.closed = true
  }
}

describe('LinkAudioPump', () => {
  const block = (frame: number): LinkTapBlock => ({
    frame,
    frames: 4,
    channels: 1,
    samples: new Float32Array([1, 2, 3, 4]),
  })

  function build() {
    const socket = new FakeAudioSocket()
    const events: string[] = []
    const pump = new LinkAudioPump({
      socket,
      sampleRate: 48_000,
      onOpen: () => events.push('open'),
      onClose: (reason) => events.push(`close: ${reason}`),
    })
    return { socket, pump, events }
  }

  it('sends each block stamped with when it is heard', () => {
    const { socket, pump, events } = build()
    expect(socket.binaryType).toBe('arraybuffer')
    socket.readyState = 1
    socket.onopen?.({})
    pump.setClock({ contextTime: 1, hostMicros: 50_000_000 })
    pump.send(block(96_000))
    expect(events).toEqual(['open'])
    expect(socket.sent).toHaveLength(1)
    expect(new DataView(socket.sent[0]).getFloat64(16, true)).toBe(51_000_000)
    expect(pump.takeStats()).toEqual({ blocks: 1, dropped: 0 })
    expect(pump.takeStats()).toEqual({ blocks: 0, dropped: 0 })
  })

  it('drops what it cannot send now: no clock yet, not open, or backed up', () => {
    const { socket, pump } = build()
    pump.send(block(0)) // not open, no clock
    socket.readyState = 1
    pump.send(block(4)) // open, no clock
    pump.setClock({ contextTime: 0, hostMicros: 0 })
    socket.bufferedAmount = LINK_AUDIO_MAX_QUEUED_BYTES + 1
    pump.send(block(8)) // backed up
    socket.bufferedAmount = 0
    pump.send(block(12))
    expect(socket.sent).toHaveLength(1)
    expect(pump.takeStats()).toEqual({ blocks: 1, dropped: 3 })
  })

  it('says once why the channel closed', () => {
    const { socket, pump, events } = build()
    socket.onerror?.({})
    socket.onclose?.({ reason: '' })
    expect(events).toEqual(['close: the connection to the plug-in host failed'])
    pump.setClock({ contextTime: 0, hostMicros: 0 })
    socket.readyState = 1
    pump.send(block(0))
    expect(socket.sent).toHaveLength(0)
  })

  it('closes its socket when stopped, without calling it a failure', () => {
    const { socket, pump, events } = build()
    pump.stop()
    socket.onclose?.({})
    expect(socket.closed).toBe(true)
    expect(events).toEqual([])
  })
})
