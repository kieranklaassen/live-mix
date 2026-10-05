import { describe, expect, it } from 'vitest'

import { LinkAudioIntake, type LinkIntakeSocket } from '../LinkAudioIntake'
import { LinkAudioPlayout } from '../LinkAudioPlayout'
import {
  HOST_MESSAGE_LINK_AUDIO_IN,
  LINK_AUDIO_IN_HEADER_BYTES,
  decodeLinkAudioInBlock,
  encodeLinkAudioInBlock,
  linkContextTimeAt,
  type LinkReceivedBlock,
  type LinkSourceEvent,
} from '../link-receive-protocol'

const CONTEXT_RATE = 48000
const QUANTUM = 128

interface Stream {
  /** The sender's sample rate, as its blocks say it. */
  rate: number
  /** Frames in a block. */
  blockFrames: number
  channels?: 1 | 2
  /** The sample of frame `k`: one value for a mono stream, a pair for stereo. */
  sample: (frame: number) => number | [number, number]
  /** The context time heard here when frame `k` was heard at the sender. Default: frame 0 at 1 s, at `rate`. */
  heardAt?: (frame: number) => number
  /** Seconds between a block's last frame being heard at the sender and its reaching the playout. */
  transit?: (block: number) => number
  /** Blocks the network lost. */
  lost?: (block: number) => boolean
  /** The sender's count of its first block. */
  firstCount?: number
}

/**
 * Plays `stream` into `playout` as an audio thread would: a quantum at a
 * time from context time 1 s, each block handed over between quanta once it
 * has arrived. Returns what came out, from frame 0 of the context.
 */
function play(
  playout: LinkAudioPlayout,
  stream: Stream,
  seconds: number,
  from = 1,
  out?: { left: Float32Array; right: Float32Array },
) {
  const { rate, blockFrames } = stream
  const channels = stream.channels ?? 1
  const heardAt = stream.heardAt ?? ((frame: number) => 1 + frame / rate)
  const transit = stream.transit ?? (() => 0.005)
  const total = Math.round((from + seconds) * CONTEXT_RATE)
  const left = out?.left ?? new Float32Array(total)
  const right = out?.right ?? new Float32Array(total)
  let next = 0
  for (let frame = Math.round(from * CONTEXT_RATE); frame + QUANTUM <= total; frame += QUANTUM) {
    const now = frame / CONTEXT_RATE
    for (;;) {
      const arrives = heardAt((next + 1) * blockFrames) + transit(next)
      if (arrives > now) break
      if (!stream.lost?.(next)) {
        const samples = new Float32Array(blockFrames * channels)
        for (let i = 0; i < blockFrames; i += 1) {
          const value = stream.sample(next * blockFrames + i)
          if (typeof value === 'number') samples[i * channels] = value
          else samples.set(value, i * channels)
        }
        const block: LinkReceivedBlock = {
          frames: blockFrames,
          channels,
          sampleRate: rate,
          count: (stream.firstCount ?? 0) + next,
          contextTime: heardAt(next * blockFrames),
          samples,
        }
        playout.push(block, now)
      }
      next += 1
    }
    playout.process(
      left.subarray(frame, frame + QUANTUM),
      right.subarray(frame, frame + QUANTUM),
      frame,
    )
  }
  return { left, right }
}

/** The context frame at a time in seconds. */
const frameAt = (time: number) => Math.round(time * CONTEXT_RATE)

/** The frames of `signal` louder than `above`. */
const loud = (signal: Float32Array, above = 0.5) =>
  Array.from(signal.keys()).filter((index) => Math.abs(signal[index]) > above)

/** A click on every `every`-th frame. */
const clicks = (every: number) => (frame: number) => (frame % every === 0 ? 1 : 0)

function collect() {
  const events: LinkSourceEvent[] = []
  const delays = () => events.flatMap((event) => (event.type === 'delay' ? [event.delaySec] : []))
  const stats = () => events.flatMap((event) => (event.type === 'stats' ? [event.stats] : []))
  return { events, emit: (event: LinkSourceEvent) => events.push(event), delays, stats }
}

describe('LinkAudioPlayout', () => {
  it('plays each sample its delay after the moment it was heard', () => {
    const { emit, stats } = collect()
    const playout = new LinkAudioPlayout({ sampleRate: CONTEXT_RATE, delaySec: 0.05 }, emit)
    // A click every tenth of a second, the first heard at 1 s.
    const { left, right } = play(
      playout,
      { rate: 48000, blockFrames: 480, sample: clicks(4800) },
      1,
    )
    // Blocks reach the playout 15 ms after their first frame: the first click is gone by then.
    const expected = [1.15, 1.25, 1.35, 1.45, 1.55, 1.65, 1.75, 1.85, 1.95].map(frameAt)
    expect(loud(left)).toEqual(expected)
    // A mono channel comes out of both sides.
    expect(loud(right)).toEqual(expected)
    for (const frame of expected) expect(left[frame]).toBeGreaterThan(0.999)
    expect(playout.delaySec).toBe(0.05)
    expect(stats().every((entry) => entry.starvedFrames === 0 && entry.lost === 0)).toBe(true)
  })

  it('keeps left and right apart', () => {
    const playout = new LinkAudioPlayout({ sampleRate: CONTEXT_RATE, delaySec: 0.05 }, () => {})
    const { left, right } = play(
      playout,
      {
        rate: 48000,
        blockFrames: 256,
        channels: 2,
        sample: (frame) => [frame % 4800 === 0 ? 1 : 0, frame % 4800 === 2400 ? -1 : 0],
      },
      0.5,
    )
    expect(loud(left)).toEqual([1.15, 1.25, 1.35, 1.45].map(frameAt))
    expect(loud(right)).toEqual([1.1, 1.2, 1.3, 1.4].map(frameAt))
    expect(right[frameAt(1.1)]).toBeLessThan(-0.999)
  })

  it('settles on a delay that covers how late blocks arrive, and says so once', () => {
    const { emit, delays, stats } = collect()
    const playout = new LinkAudioPlayout({ sampleRate: CONTEXT_RATE }, emit)
    expect(playout.delaySec).toBeNull()
    // 10 ms blocks that take 20 ms to arrive: the first frame of each is 30 ms
    // old, and up to a quantum more by the time the audio thread takes it.
    const { left } = play(
      playout,
      { rate: 48000, blockFrames: 480, sample: clicks(4800), transit: () => 0.02 },
      2,
    )
    expect(delays()).toHaveLength(1)
    const [delay] = delays()
    expect(delay).toBeGreaterThanOrEqual(0.034)
    expect(delay).toBeLessThanOrEqual(0.034 + 2 * (QUANTUM / CONTEXT_RATE) + 0.0015)
    expect(playout.delaySec).toBe(delay)

    // Nothing is heard for the quarter second it listens first; after that every click is on its moment.
    const heard = loud(left)
    expect(heard[0] / CONTEXT_RATE).toBeGreaterThan(1.25)
    for (const frame of heard) {
      const moment = frame / CONTEXT_RATE - delay
      expect(Math.abs(moment * 10 - Math.round(moment * 10)) / 10).toBeLessThan(1 / CONTEXT_RATE)
    }
    expect(heard.length).toBeGreaterThanOrEqual(16)
    expect(
      stats()
        .slice(1)
        .every((entry) => entry.starvedFrames === 0),
    ).toBe(true)
  })

  it('plays a channel sent at another sample rate at its own pitch', () => {
    const playout = new LinkAudioPlayout({ sampleRate: CONTEXT_RATE, delaySec: 0.04 }, () => {})
    const hz = 441
    const { left } = play(
      playout,
      {
        rate: 44100,
        blockFrames: 441,
        sample: (frame) => 0.8 * Math.sin((2 * Math.PI * hz * frame) / 44100),
      },
      1,
    )
    // What was heard at the sender at time t is here at t + 40 ms.
    let worst = 0
    for (let frame = frameAt(1.1); frame < frameAt(1.9); frame += 1) {
      const moment = frame / CONTEXT_RATE - 0.04 - 1
      worst = Math.max(worst, Math.abs(left[frame] - 0.8 * Math.sin(2 * Math.PI * hz * moment)))
    }
    expect(worst).toBeLessThan(0.002)
  })

  it('follows a sender whose clock runs a little fast, without running dry or piling up', () => {
    const { emit, stats } = collect()
    const playout = new LinkAudioPlayout({ sampleRate: CONTEXT_RATE, delaySec: 0.03 }, emit)
    // 100 parts in a million: its 48 000 frames take a tenth of a millisecond less than a second.
    const real = 48000 * (1 + 100e-6)
    const { left } = play(
      playout,
      {
        rate: 48000,
        blockFrames: 480,
        sample: clicks(4800),
        heardAt: (frame) => 1 + frame / real,
      },
      20,
    )
    const heard = loud(left, 0.3)
    expect(heard.length).toBeGreaterThanOrEqual(198)
    // Every click within a fifth of a millisecond of its moment, to the end.
    let worst = 0
    for (const frame of heard) {
      const sent = Math.round(((frame / CONTEXT_RATE - 0.03 - 1) * real) / 4800)
      const moment = 1 + (sent * 4800) / real + 0.03
      worst = Math.max(worst, Math.abs(frame / CONTEXT_RATE - moment))
    }
    expect(worst).toBeLessThan(0.0002)
    expect(stats().every((entry) => entry.starvedFrames === 0)).toBe(true)
  })

  it('leaves a lost block silent and keeps what follows on its moment', () => {
    const { emit, stats } = collect()
    const playout = new LinkAudioPlayout({ sampleRate: CONTEXT_RATE, delaySec: 0.05 }, emit)
    const { left } = play(
      playout,
      {
        rate: 48000,
        blockFrames: 480,
        // A steady level, so the hole shows; the click after it says where the stream is.
        sample: (frame) => (frame === 24000 ? 1 : 0.25),
        lost: (block) => block === 30 || block === 31,
      },
      2,
    )
    // Blocks 30 and 31 are frames 14 400 to 15 359: heard at 1.3 s, here at 1.35 s.
    const hole = frameAt(1.35)
    expect(left[hole - 10]).toBeCloseTo(0.25, 5)
    expect(left[hole + 100]).toBe(0)
    expect(left[hole + 900]).toBe(0)
    expect(left[hole + 970]).toBeCloseTo(0.25, 5)
    expect(loud(left)).toEqual([frameAt(1.55)])
    const total = stats().reduce((sum, entry) => sum + entry.lost, 0)
    expect(total).toBe(2)
  })

  it('grows the delay when blocks keep arriving too late for it, not for one that does', () => {
    const { emit, delays } = collect()
    const playout = new LinkAudioPlayout({ sampleRate: CONTEXT_RATE }, emit)
    const { left } = play(
      playout,
      {
        rate: 48000,
        blockFrames: 480,
        sample: clicks(4800),
        // One block stalls after a second; from two seconds on every block takes 60 ms.
        transit: (block) => (block === 100 ? 0.08 : block >= 200 ? 0.06 : 0.005),
      },
      4,
    )
    expect(delays()).toHaveLength(2)
    const [first, second] = delays()
    expect(first).toBeLessThan(0.03)
    // The 60 ms on the way and the 10 ms of the block itself, and a margin.
    expect(second).toBeGreaterThan(0.07)
    expect(second).toBeLessThan(0.085)
    // The last second is on its moment again, by the new delay.
    const late = loud(left).filter((frame) => frame > 4 * CONTEXT_RATE)
    expect(late.length).toBeGreaterThanOrEqual(9)
    for (const frame of late) {
      const moment = frame / CONTEXT_RATE - second
      expect(Math.abs(moment * 10 - Math.round(moment * 10)) / 10).toBeLessThan(1 / CONTEXT_RATE)
    }
  })

  it('starts over when the sender does', () => {
    const { emit, delays } = collect()
    const playout = new LinkAudioPlayout({ sampleRate: CONTEXT_RATE }, emit)
    const out = play(playout, { rate: 48000, blockFrames: 480, sample: clicks(4800) }, 1)
    expect(loud(out.left).length).toBeGreaterThan(5)
    // The sender stops for a second and begins again, counting from nought.
    const again = play(
      playout,
      {
        rate: 48000,
        blockFrames: 480,
        sample: clicks(4800),
        heardAt: (frame) => 3 + frame / 48000,
      },
      1.5,
      3,
      {
        left: new Float32Array(4.5 * CONTEXT_RATE),
        right: new Float32Array(4.5 * CONTEXT_RATE),
      },
    )
    // The delay it had is the delay it keeps: nothing is listened to again first.
    expect(delays()).toHaveLength(1)
    const [delay] = delays()
    // And the new run is heard, every click its delay after its moment.
    const heard = loud(again.left)
    expect(heard.length).toBeGreaterThanOrEqual(14)
    for (const frame of heard) {
      const moment = frame / CONTEXT_RATE - delay
      expect(moment).toBeGreaterThanOrEqual(3 - 1 / CONTEXT_RATE)
      expect(Math.abs(moment * 10 - Math.round(moment * 10)) / 10).toBeLessThan(1 / CONTEXT_RATE)
    }
  })

  it.each([
    ['later', 0.02],
    ['earlier', -0.02],
  ])('goes with the output at once when it moves %s, and is on the moment again', (_way, moved) => {
    const playout = new LinkAudioPlayout({ sampleRate: CONTEXT_RATE, delaySec: 0.05 }, () => {})
    // Two seconds in, the output moves (it drops buffers, say): every moment is heard 20 ms off from there.
    const { left } = play(
      playout,
      {
        rate: 48000,
        blockFrames: 480,
        sample: clicks(4800),
        heardAt: (frame) => 1 + frame / 48000 + (frame >= 96000 ? moved : 0),
      },
      4,
    )
    const heard = loud(left)
    // Before it: on the old moments.
    for (const frame of heard.filter((each) => each < frameAt(3))) {
      const moment = frame / CONTEXT_RATE - 0.05
      expect(Math.abs(moment * 10 - Math.round(moment * 10)) / 10).toBeLessThan(1 / CONTEXT_RATE)
    }
    // A fifth of a second after it, and from there on: on the new ones, not sliding towards them.
    const after = heard.filter((each) => each > frameAt(3.2))
    expect(after.length).toBeGreaterThanOrEqual(17)
    for (const frame of after) {
      const moment = frame / CONTEXT_RATE - 0.05 - moved
      expect(Math.abs(moment * 10 - Math.round(moment * 10)) / 10).toBeLessThan(1 / CONTEXT_RATE)
    }
  })

  it('leaves out a block that comes after the ones that followed it', () => {
    const playout = new LinkAudioPlayout({ sampleRate: CONTEXT_RATE, delaySec: 0.05 }, () => {})
    const block = (count: number, value: number): LinkReceivedBlock => ({
      frames: 480,
      channels: 1,
      sampleRate: 48000,
      count,
      contextTime: 1 + count * 0.01,
      samples: new Float32Array(480).fill(value),
    })
    playout.push(block(0, 0.25), 1.005)
    playout.push(block(2, 0.25), 1.025)
    // Block 1 took the long way round: its place has been left silent and stays so.
    playout.push(block(1, 1), 1.03)
    playout.push(block(3, 0.25), 1.035)
    const left = new Float32Array(CONTEXT_RATE * 1.1)
    const right = new Float32Array(left.length)
    for (let frame = frameAt(1); frame + QUANTUM <= left.length; frame += QUANTUM) {
      playout.process(
        left.subarray(frame, frame + QUANTUM),
        right.subarray(frame, frame + QUANTUM),
        frame,
      )
    }
    expect(loud(left)).toHaveLength(0)
    expect(left[frameAt(1.055)]).toBeCloseTo(0.25, 3)
    expect(left[frameAt(1.065)]).toBe(0)
    expect(left[frameAt(1.075)]).toBeCloseTo(0.25, 3)
    expect(playout.takeStats().lost).toBe(1)
  })

  it('picks a stream up where its moments say after a pause in the sending', () => {
    const playout = new LinkAudioPlayout({ sampleRate: CONTEXT_RATE, delaySec: 0.05 }, () => {})
    // Blocks 100 to 199 are never made: the count runs on, the moments jump a second.
    const { left } = play(
      playout,
      {
        rate: 48000,
        blockFrames: 480,
        sample: clicks(4800),
        heardAt: (frame) => 1 + frame / 48000 + (frame >= 48000 ? 1 : 0),
      },
      3,
    )
    const after = loud(left).filter((frame) => frame > 3 * CONTEXT_RATE)
    expect(after.slice(0, 3)).toEqual([3.05, 3.15, 3.25].map(frameAt))
  })
})

describe('the received block on the wire', () => {
  it('goes through the encoder and back', () => {
    const samples = new Float32Array([0.5, -0.5, 0.25, -0.25])
    const message = encodeLinkAudioInBlock({
      frames: 2,
      channels: 2,
      sampleRate: 44100,
      atMicros: 123_456_789.5,
      count: 42,
      samples,
    })
    expect(message.byteLength).toBe(LINK_AUDIO_IN_HEADER_BYTES + 16)
    expect(new Uint32Array(message, 0, 1)[0]).toBe(HOST_MESSAGE_LINK_AUDIO_IN)
    expect(decodeLinkAudioInBlock(message)).toEqual({
      frames: 2,
      channels: 2,
      sampleRate: 44100,
      atMicros: 123_456_789.5,
      count: 42,
      samples,
    })
  })

  it('is not read when it is not whole', () => {
    const message = encodeLinkAudioInBlock({
      frames: 2,
      channels: 1,
      sampleRate: 48000,
      atMicros: 1,
      count: 0,
      samples: new Float32Array(2),
    })
    expect(decodeLinkAudioInBlock(message.slice(0, 20))).toBeNull()
    expect(decodeLinkAudioInBlock(message.slice(0, message.byteLength - 4))).toBeNull()
    const other = message.slice(0)
    new Uint32Array(other, 0, 1)[0] = 3
    expect(decodeLinkAudioInBlock(other)).toBeNull()
  })

  it('is not read at a sample rate no device runs at', () => {
    const at = (sampleRate: number) =>
      decodeLinkAudioInBlock(
        encodeLinkAudioInBlock({
          frames: 2,
          channels: 1,
          sampleRate,
          atMicros: 1,
          count: 0,
          samples: new Float32Array(2),
        }),
      )
    // The fastest the host takes from a page is taken from a peer too.
    expect(at(768000)?.sampleRate).toBe(768000)
    expect(at(768001)).toBeNull()
    // What the playout would have asked 32 GB of memory for.
    expect(at(4_000_000_000)).toBeNull()
  })
})

describe('LinkAudioIntake', () => {
  function build() {
    const socket: LinkIntakeSocket & { closedByUs: boolean } = {
      binaryType: '',
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
      closedByUs: false,
      close() {
        this.closedByUs = true
      },
    }
    const blocks: LinkReceivedBlock[] = []
    const log: string[] = []
    const intake = new LinkAudioIntake({
      socket,
      deliver: (block) => blocks.push(block),
      onOpen: () => log.push('open'),
      onClose: (reason) => log.push(`close: ${reason}`),
    })
    const message = (atMicros: number, count = 0) =>
      encodeLinkAudioInBlock({
        frames: 2,
        channels: 1,
        sampleRate: 48000,
        atMicros,
        count,
        samples: new Float32Array([0.5, -0.5]),
      })
    return { socket, intake, blocks, log, message }
  }

  it('gives each block the context time heard at its moment', () => {
    const { socket, intake, blocks, message } = build()
    expect(socket.binaryType).toBe('arraybuffer')
    // Context time 2 s is heard at 12 010 000 µs on the host's clock.
    intake.setClock({ contextTime: 2, hostMicros: 12_010_000 })
    socket.onmessage?.({ data: message(12_510_000, 7) })
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({ frames: 2, channels: 1, sampleRate: 48000, count: 7 })
    expect(blocks[0].contextTime).toBeCloseTo(2.5, 9)
    expect(Array.from(blocks[0].samples)).toEqual([0.5, -0.5])
    expect(linkContextTimeAt(11_010_000, { contextTime: 2, hostMicros: 12_010_000 })).toBe(1)
  })

  it('lets go of what arrives before the clocks are known, and of what is not a block', () => {
    const { socket, intake, blocks, message } = build()
    socket.onmessage?.({ data: message(1) })
    intake.setClock({ contextTime: 0, hostMicros: 0 })
    socket.onmessage?.({ data: 'hello' })
    socket.onmessage?.({ data: new ArrayBuffer(8) })
    expect(blocks).toHaveLength(0)
    socket.onmessage?.({ data: message(1) })
    expect(blocks).toHaveLength(1)
  })

  it('says when the connection opens and why it closed, once', () => {
    const { socket, intake, blocks, log, message } = build()
    socket.onopen?.({})
    socket.onclose?.({})
    socket.onerror?.({})
    expect(log).toEqual(['open', 'close: the plug-in host closed the channel'])
    intake.setClock({ contextTime: 0, hostMicros: 0 })
    socket.onmessage?.({ data: message(1) })
    expect(blocks).toHaveLength(0)

    const other = build()
    other.intake.stop()
    expect(other.socket.closedByUs).toBe(true)
    other.socket.onclose?.({ reason: 'gone' })
    expect(other.log).toEqual([])
  })
})
