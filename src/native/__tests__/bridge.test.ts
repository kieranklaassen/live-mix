import { describe, expect, it } from 'vitest'

import { BridgeKernel } from '../BridgeKernel'
import { BridgePump, type PumpSocket } from '../BridgePump'
import {
  BRIDGE_ACTIVE,
  BRIDGE_LATENCY,
  BRIDGE_MAX_BLOCK_FRAMES,
  BRIDGE_READY,
  BRIDGE_UNDERRUNS,
  BRIDGE_WRITTEN,
  HOST_HEADER_BYTES,
  HOST_MESSAGE_MIDI,
  HOST_MESSAGE_PROCESS,
  allocateBridgeMemory,
  clampBridgeLatency,
  clearRing,
  frameDistance,
  readRing,
  writeRing,
} from '../bridge-protocol'

const QUANTUM = 128

/** Stands in for the host: answers every process message with the input times `gain`. */
class EchoSocket implements PumpSocket {
  binaryType = ''
  readyState = 1
  onopen: ((event: unknown) => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  onclose: ((event: { reason?: string }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  readonly sent: ArrayBuffer[] = []
  readonly replies: ArrayBuffer[] = []
  gain = 0.5
  outputChannels = 2
  closed = false

  send(data: ArrayBuffer): void {
    const copy = data.slice(0)
    this.sent.push(copy)
    const [type, frames, channels, sequence] = new Uint32Array(copy, 0, 4)
    if (type !== HOST_MESSAGE_PROCESS) return
    const input = new Float32Array(copy, HOST_HEADER_BYTES)
    const reply = new ArrayBuffer(HOST_HEADER_BYTES + frames * this.outputChannels * 4)
    new Uint32Array(reply, 0, 4).set([HOST_MESSAGE_PROCESS, frames, this.outputChannels, sequence])
    const output = new Float32Array(reply, HOST_HEADER_BYTES)
    for (let channel = 0; channel < this.outputChannels; channel += 1) {
      for (let frame = 0; frame < frames; frame += 1) {
        const source = channels === 0 ? 1 : input[Math.min(channel, channels - 1) * frames + frame]
        output[channel * frames + frame] = source * this.gain
      }
    }
    this.replies.push(reply)
  }

  /** Hand the pump the replies produced so far (all of them, or the first `count`). */
  answer(count = this.replies.length): void {
    for (const reply of this.replies.splice(0, count)) this.onmessage?.({ data: reply })
  }

  close(): void {
    this.closed = true
    this.onclose?.({ reason: '' })
  }
}

function makeBridge(latencyFrames = 256, inputChannels = 2) {
  const memory = allocateBridgeMemory(inputChannels, 2)
  const control = new Int32Array(memory.control)
  Atomics.store(control, BRIDGE_LATENCY, latencyFrames)
  const socket = new EchoSocket()
  const events: string[] = []
  const pump = new BridgePump({
    memory,
    socket,
    now: () => 0,
    onOpen: () => events.push('open'),
    onClose: (reason) => events.push(`close:${reason}`),
  })
  const kernel = new BridgeKernel(memory)
  let frame = 0
  /** One render quantum of a ramp (sample n has value n + 1); returns the output. */
  const render = (): Float32Array[] => {
    const input = [new Float32Array(QUANTUM), new Float32Array(QUANTUM)]
    for (let i = 0; i < QUANTUM; i += 1) {
      input[0][i] = frame + i + 1
      input[1][i] = -(frame + i + 1)
    }
    frame += QUANTUM
    const output = [new Float32Array(QUANTUM), new Float32Array(QUANTUM)]
    kernel.process(input, output)
    return output
  }
  return { memory, control, socket, pump, kernel, render, events }
}

describe('ring helpers', () => {
  it('write, read and clear wrap at the ring length, per channel', () => {
    const ring = new Float32Array(2 * 8)
    writeRing(ring, 8, 1, 6, Float32Array.from([1, 2, 3, 4]), 0, 4)
    expect([...ring.subarray(8)]).toEqual([3, 4, 0, 0, 0, 0, 1, 2])
    expect([...ring.subarray(0, 8)]).toEqual(new Array(8).fill(0))
    const out = new Float32Array(6)
    readRing(ring, 8, 1, 6, out, 1, 4)
    expect([...out]).toEqual([0, 1, 2, 3, 4, 0])
    clearRing(ring, 8, 1, 7, 2)
    expect([...ring.subarray(8)]).toEqual([0, 4, 0, 0, 0, 0, 1, 0])
  })

  it('frame indices compare across the 2^32 wrap', () => {
    expect(frameDistance(128, 0)).toBe(128)
    expect(frameDistance(64, 0xffffffc0 | 0)).toBe(128)
    expect(frameDistance(0, 128)).toBe(-128)
  })

  it('bridge latency snaps to whole render quanta inside its range', () => {
    expect(clampBridgeLatency(500)).toBe(512)
    expect(clampBridgeLatency(1)).toBe(128)
    expect(clampBridgeLatency(1e9)).toBe(8192)
    expect(clampBridgeLatency(Number.NaN)).toBe(512)
  })
})

describe('bridge kernel and pump', () => {
  it('plays the host output exactly `latency` frames after the input, sample for sample', () => {
    const { render, pump, socket, control, events } = makeBridge(256)
    expect(events).toEqual(['open'])
    expect(Atomics.load(control, BRIDGE_ACTIVE)).toBe(1)

    const heard: number[] = []
    for (let quantum = 0; quantum < 8; quantum += 1) {
      heard.push(...render()[0])
      pump.flush()
      socket.answer()
    }
    // 256 frames of silence, then the ramp at half gain.
    expect(heard.slice(0, 256).every((value) => value === 0)).toBe(true)
    expect(heard.slice(256, 260)).toEqual([0.5, 1, 1.5, 2])
    expect(heard[1023]).toBe((1023 - 256 + 1) * 0.5)
    expect(Atomics.load(control, BRIDGE_UNDERRUNS)).toBe(0)
  })

  it('keeps both channels apart', () => {
    const { render, pump, socket } = makeBridge(128)
    render()
    pump.flush()
    socket.answer()
    const [left, right] = render()
    expect(left[0]).toBe(0.5)
    expect(right[0]).toBe(-0.5)
  })

  it('a late answer plays as silence, counts an underrun and does not shift what follows', () => {
    const { render, pump, socket, control } = makeBridge(128)
    render()
    pump.flush()
    // The host has not answered yet: the quantum that needed it is silent.
    const late = render()[0]
    expect([...late.subarray(0, 4)]).toEqual([0, 0, 0, 0])
    expect(Atomics.load(control, BRIDGE_UNDERRUNS)).toBe(1)

    pump.flush()
    socket.answer()
    // The next quantum is the one that follows in time, not the one that was missed.
    const next = render()[0]
    expect(next[0]).toBe((128 + 1) * 0.5)
    expect(Atomics.load(control, BRIDGE_UNDERRUNS)).toBe(1)
  })

  it('sends at most BRIDGE_MAX_BLOCK_FRAMES per message, in order, planar', () => {
    const { render, pump, socket } = makeBridge(1024)
    for (let quantum = 0; quantum < 6; quantum += 1) render()
    expect(pump.flush()).toBe(768)
    expect(socket.sent).toHaveLength(2)
    const first = new Uint32Array(socket.sent[0], 0, 4)
    const second = new Uint32Array(socket.sent[1], 0, 4)
    expect([...first]).toEqual([HOST_MESSAGE_PROCESS, BRIDGE_MAX_BLOCK_FRAMES, 2, 0])
    expect([...second]).toEqual([HOST_MESSAGE_PROCESS, 256, 2, 1])
    const payload = new Float32Array(socket.sent[1], HOST_HEADER_BYTES)
    expect(payload[0]).toBe(513)
    expect(payload[256]).toBe(-513)
    expect(pump.flush()).toBe(0)
  })

  it('an instrument sends no input and still gets stereo back', () => {
    const { render, pump, socket } = makeBridge(128, 0)
    render()
    pump.flush()
    expect(socket.sent[0].byteLength).toBe(HOST_HEADER_BYTES)
    expect(new Uint32Array(socket.sent[0], 0, 4)[2]).toBe(0)
    socket.answer()
    const [left, right] = render()
    expect(left[0]).toBe(0.5)
    expect(right[127]).toBe(0.5)
  })

  it('a mono answer feeds both output channels', () => {
    const { render, pump, socket } = makeBridge(128)
    socket.outputChannels = 1
    render()
    pump.flush()
    socket.answer()
    const [left, right] = render()
    expect(left[0]).toBe(0.5)
    expect(right[0]).toBe(0.5)
  })

  it('falling a whole ring behind drops the old input and plays the gap as silence', () => {
    const { memory, render, pump, socket, control } = makeBridge(128)
    const quanta = memory.ringFrames / QUANTUM + 4
    for (let quantum = 0; quantum < quanta; quantum += 1) render()
    const sent = pump.flush()
    expect(sent).toBe(BRIDGE_MAX_BLOCK_FRAMES)
    expect(pump.takeStats().droppedFrames).toBe(quanta * QUANTUM - BRIDGE_MAX_BLOCK_FRAMES)
    socket.answer()
    expect(Atomics.load(control, BRIDGE_READY)).toBe(Atomics.load(control, BRIDGE_WRITTEN))
    const next = render()[0]
    expect(next[0]).toBe((quanta * QUANTUM - 128 + 1) * 0.5)
  })

  it('goes silent and inactive when the connection closes, and reports why', () => {
    const { render, pump, socket, control, events } = makeBridge(128)
    render()
    pump.flush()
    socket.answer()
    socket.close()
    expect(Atomics.load(control, BRIDGE_ACTIVE)).toBe(0)
    expect(events[1]).toBe('close:the plug-in host closed the connection')
    const underrunsBefore = Atomics.load(control, BRIDGE_UNDERRUNS)
    expect([...render()[0].subarray(0, 2)]).toEqual([0, 0])
    // Silence without a host is not an underrun.
    expect(Atomics.load(control, BRIDGE_UNDERRUNS)).toBe(underrunsBefore)
    expect(pump.flush()).toBe(0)
  })

  it('an answer of the wrong size ends the connection instead of misaligning the stream', () => {
    const { render, pump, socket, events } = makeBridge(128)
    render()
    pump.flush()
    const reply = socket.replies[0]
    new Uint32Array(reply, 0, 4)[1] = 64
    socket.answer()
    expect(socket.closed).toBe(true)
    expect(events).toContain('close:the plug-in host answered out of step')
  })

  it('MIDI goes out as its own message with the byte count in the header', () => {
    const { pump, socket } = makeBridge()
    pump.midi([0x90, 60, 100])
    const message = socket.sent[0]
    expect([...new Uint32Array(message, 0, 4)]).toEqual([HOST_MESSAGE_MIDI, 3, 0, 0])
    expect([...new Uint8Array(message, HOST_HEADER_BYTES, 3)]).toEqual([0x90, 60, 100])
  })

  it('reports round-trip time and resets the window on every read', () => {
    const memory = allocateBridgeMemory(2, 2)
    Atomics.store(new Int32Array(memory.control), BRIDGE_LATENCY, 128)
    const socket = new EchoSocket()
    let clock = 0
    const pump = new BridgePump({ memory, socket, now: () => clock })
    const kernel = new BridgeKernel(memory)
    const quantum = [new Float32Array(QUANTUM), new Float32Array(QUANTUM)]
    for (const elapsed of [2, 6]) {
      kernel.process(quantum, [new Float32Array(QUANTUM), new Float32Array(QUANTUM)])
      pump.flush()
      clock += elapsed
      socket.answer()
    }
    const stats = pump.takeStats()
    expect(stats.blocks).toBe(2)
    expect(stats.roundTripMeanMs).toBe(4)
    expect(stats.roundTripMaxMs).toBe(6)
    expect(pump.takeStats().blocks).toBe(0)
  })

  it('run() wakes on the worklet write, sends, and ends when the socket closes', async () => {
    const { render, pump, socket } = makeBridge(128)
    const running = pump.run()
    render()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(socket.sent).toHaveLength(1)
    render()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(socket.sent).toHaveLength(2)
    socket.close()
    await running
  })
})
