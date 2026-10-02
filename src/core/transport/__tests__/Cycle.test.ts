import { describe, expect, it } from 'vitest'

import { MockAudioContext } from '../../../testing'
import { type TransportAnchor, type TransportLoop } from '../anchor'
import { Cycle, type CycleTransport } from '../Cycle'
import { Transport } from '../Transport'

function build(lengthSec: number, loop: Partial<TransportLoop> = { enabled: true, lengthSec: 32 }) {
  const ctx = new MockAudioContext()
  ctx.currentTime = 100
  const transport = new Transport({ now: () => ctx.currentTime, loop })
  const cycle = new Cycle(transport, lengthSec)
  return { ctx, transport, cycle }
}

describe('Cycle', () => {
  it('is a loop of its own length, always on', () => {
    const { cycle, transport } = build(23.5)
    expect(cycle.lengthSec).toBe(23.5)
    expect(cycle.loop).toEqual({ enabled: true, lengthSec: 23.5 })
    transport.setLoop({ enabled: false })
    expect(cycle.loop).toEqual({ enabled: true, lengthSec: 23.5 })
    expect(() => new Cycle(transport, 0)).toThrow(RangeError)
    expect(() => new Cycle(transport, Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })

  it('has no anchor and cannot place a position while the transport is not playing', () => {
    const { cycle } = build(10)
    expect(cycle.anchor).toBeNull()
    expect(cycle.position()).toEqual({ positionSec: 0, iteration: 0, finished: false })
    expect(() => cycle.contextTimeAt(1)).toThrow(/not playing/)
  })

  it('wraps at its own length over the time the transport has run', () => {
    const { ctx, transport, cycle } = build(10)
    transport.start()
    expect(cycle.anchor).toEqual({ contextTime: 100, positionSec: 0, iteration: 0 })
    ctx.currentTime = 107
    expect(cycle.position()).toEqual({ positionSec: 7, iteration: 0, finished: false })
    ctx.currentTime = 125
    expect(cycle.position()).toEqual({ positionSec: 5, iteration: 2, finished: false })
    // The transport's own loop has not come round yet.
    expect(transport.position()).toEqual({ positionSec: 25, iteration: 0, finished: false })
    ctx.currentTime = 135
    expect(cycle.position()).toEqual({ positionSec: 5, iteration: 3, finished: false })
    expect(transport.position()).toEqual({ positionSec: 3, iteration: 1, finished: false })
  })

  it('says when a position of one of its passes comes round on the audio clock', () => {
    const { transport, cycle } = build(10)
    transport.start()
    expect(cycle.contextTimeAt(4)).toBe(104)
    expect(cycle.contextTimeAt(4, 0)).toBe(104)
    expect(cycle.contextTimeAt(4, 3)).toBe(134)
    expect(cycle.contextTimeAt(0, 4)).toBe(140)
  })

  it('wraps on a transport that does not loop at all', () => {
    const { ctx, transport, cycle } = build(10, {})
    transport.start()
    ctx.currentTime = 125
    expect(cycle.position()).toEqual({ positionSec: 5, iteration: 2, finished: false })
    expect(cycle.contextTimeAt(1, 3)).toBe(131)
  })

  it('is finished when the transport has run off its end', () => {
    const { ctx, transport, cycle } = build(10, { enabled: false, lengthSec: 25 })
    transport.start()
    ctx.currentTime = 120
    expect(cycle.position().finished).toBe(false)
    ctx.currentTime = 130
    expect(cycle.position()).toEqual({ positionSec: 5, iteration: 2, finished: true })
  })

  it('two cycles start together, slide apart, and meet where both lengths divide the run', () => {
    const { ctx, transport } = build(10)
    const a = new Cycle(transport, 4)
    const b = new Cycle(transport, 6)
    transport.start()
    ctx.currentTime = 105
    expect([a.position().positionSec, b.position().positionSec]).toEqual([1, 5])
    ctx.currentTime = 112
    expect([a.position().positionSec, b.position().positionSec]).toEqual([0, 0])
  })

  it('keeps its place over a pause, and never gives a pass number out twice', () => {
    const { ctx, transport, cycle } = build(10)
    transport.start()
    ctx.currentTime = 125
    expect(cycle.position().iteration).toBe(2)
    transport.pause()
    ctx.currentTime = 500
    transport.start()
    // Halfway through its third pass still, under a number of its own.
    expect(cycle.anchor).toEqual({ contextTime: 500, positionSec: 5, iteration: 3 })
    ctx.currentTime = 506
    expect(cycle.position()).toEqual({ positionSec: 1, iteration: 4, finished: false })
    expect(cycle.contextTimeAt(1, 4)).toBe(506)
  })

  it('numbers afresh after a seek, above a pass a start was already handed over for', () => {
    const { ctx, transport, cycle } = build(10)
    transport.start()
    ctx.currentTime = 109.9
    // The scheduler looked ahead into the next pass.
    expect(cycle.contextTimeAt(0.05, 1)).toBeCloseTo(110.05)
    transport.seek(2)
    expect(cycle.anchor).toEqual({ contextTime: 109.9, positionSec: 2, iteration: 2 })
    expect(cycle.contextTimeAt(3, 2)).toBeCloseTo(110.9)
  })

  it('follows a seek within the pass the transport is in, and seekElapsed anywhere', () => {
    const { ctx, transport, cycle } = build(10)
    transport.start()
    ctx.currentTime = 140
    // 40 s in: position 8 of the transport's second pass, the cycle at its own start.
    expect(cycle.position().positionSec).toBe(0)
    transport.seek(1)
    expect(transport.elapsed()).toBe(33)
    expect(cycle.position().positionSec).toBe(3)
    transport.seekElapsed(0)
    expect(cycle.position().positionSec).toBe(0)
    transport.stop()
    transport.seek(12)
    expect(cycle.position().positionSec).toBe(2)
  })

  it('moves to where a new length puts it, with fresh pass numbers', () => {
    const { ctx, transport, cycle } = build(10)
    transport.start()
    ctx.currentTime = 125
    expect(cycle.position()).toEqual({ positionSec: 5, iteration: 2, finished: false })
    cycle.lengthSec = 20
    // The pass the anchor is on takes the next free number, and this is the one after.
    expect(cycle.anchor).toEqual({ contextTime: 100, positionSec: 0, iteration: 3 })
    expect(cycle.position()).toEqual({ positionSec: 5, iteration: 4, finished: false })
    expect(cycle.contextTimeAt(0, 5)).toBe(140)
    expect(() => (cycle.lengthSec = -1)).toThrow(RangeError)
  })
})

describe('Cycle of a length a float cannot hold exactly', () => {
  // 29 lengths of 35.765 s divided by one comes out a hair under 29.
  const lengthSec = 35.765

  it('is at the start of a pass, not the last instant of the one before, where its lengths add up', () => {
    for (const passes of [29, 31, 58, 62, 116]) {
      const { transport, cycle } = build(lengthSec)
      expect(Math.floor((passes * lengthSec) / lengthSec)).toBe(passes - 1)
      transport.seekElapsed(passes * lengthSec)
      transport.start()
      const here = cycle.position()
      expect(here.positionSec).toBe(0)
      expect(cycle.passOf(here.iteration)).toBe(passes)
      expect(cycle.anchor).toMatchObject({ positionSec: 0, iteration: here.iteration })
      // A clip at the start of the pass is due now, not a whole length from now.
      expect(cycle.contextTimeAt(0, here.iteration)).toBeCloseTo(100, 9)
    }
  })

  it('meets a cycle of another length at the start of both', () => {
    const { transport, cycle } = build(lengthSec)
    const other = new Cycle(transport, 25.9)
    // 5180 lengths of 35.765 s are 7153 of 25.9 s.
    transport.seekElapsed(7153 * 25.9)
    transport.start()
    expect(cycle.position().positionSec).toBeCloseTo(0, 6)
    expect(other.position().positionSec).toBeCloseTo(0, 6)
    expect(cycle.position().positionSec).toBeLessThan(1)
    expect(other.position().positionSec).toBeLessThan(1)
  })
})

describe('Cycle counted pass', () => {
  it('counts its own passes from the origin of the timeline, whatever number a pass goes by', () => {
    const { ctx, transport, cycle } = build(10)
    transport.start()
    ctx.currentTime = 125
    expect(cycle.passOf(cycle.position().iteration)).toBe(2)

    // A pause and a start give every pass a new number; the count is kept.
    transport.pause()
    transport.start()
    const here = cycle.position()
    expect(here.iteration).toBeGreaterThan(2)
    expect(cycle.passOf(here.iteration)).toBe(2)
    expect(cycle.passOf(here.iteration + 3)).toBe(5)

    transport.pause()
    expect(cycle.passOf(here.iteration)).toBe(2)
    transport.stop()
    expect(cycle.passOf(0)).toBe(0)
  })

  it('goes where the transport is put on the whole run', () => {
    const { transport, cycle } = build(10)
    transport.seekElapsed(47)
    transport.start()
    expect(cycle.passOf(cycle.position().iteration)).toBe(4)
    // Pass 3 of a 32 s loop, 15 s in: 111 s of the run.
    transport.setPass(3)
    expect(cycle.passOf(cycle.position().iteration)).toBe(11)
  })
})

describe('Cycle on a transport that changes speed', () => {
  it('runs at the transport\u2019s rate: its length is timeline seconds', () => {
    const { ctx, transport, cycle } = build(10)
    transport.setRate(2)
    expect(cycle.rate).toBe(2)
    transport.start()
    // 12 s of the clock is 24 s of the timeline: 4 s into the cycle's third pass.
    ctx.currentTime = 112
    expect(cycle.position()).toEqual({ positionSec: 4, iteration: 2, finished: false })
    expect(transport.position()).toEqual({ positionSec: 24, iteration: 0, finished: false })
    // The pass after next starts 6 timeline seconds on, 3 on the clock.
    expect(cycle.contextTimeAt(0, 3)).toBe(115)
  })

  it('keeps its pass numbers through a change of rate, and only the clock times move', () => {
    const { ctx, transport, cycle } = build(10)
    transport.start()
    ctx.currentTime = 123
    expect(cycle.position()).toEqual({ positionSec: 3, iteration: 2, finished: false })
    // A start handed over for the next pass, 7 s on.
    expect(cycle.contextTimeAt(0, 3)).toBe(130)
    transport.setRate(0.5)
    expect(cycle.position()).toEqual({ positionSec: 3, iteration: 2, finished: false })
    // The same pass, now 14 s on.
    expect(cycle.contextTimeAt(0, 3)).toBe(137)
    ctx.currentTime = 137
    expect(cycle.position()).toEqual({ positionSec: 0, iteration: 3, finished: false })
    expect(transport.elapsed()).toBe(30)
  })

  it('still meets another cycle where both lengths divide the run, sooner or later by the clock', () => {
    const { ctx, transport, cycle } = build(6)
    const other = new Cycle(transport, 10)
    transport.setRate(1.5)
    transport.start()
    // 30 s of the timeline is 20 s of the clock.
    ctx.currentTime = 120
    expect(cycle.position().positionSec).toBe(0)
    expect(other.position().positionSec).toBe(0)
    expect(transport.elapsed()).toBe(30)
  })
})

describe('Cycle on a transport whose anchor moves along in place', () => {
  // A transport that re-pins where it is without taking a fresh pass number
  // (a change of speed, say): elapsed time runs on unbroken.
  class MovingTransport implements CycleTransport {
    anchor: TransportAnchor = { contextTime: 0, positionSec: 0, iteration: 5 }
    loop: TransportLoop = { enabled: true, lengthSec: 32 }
    time = 0
    private elapsedAtAnchor = 0

    now(): number {
      return this.time
    }

    position(contextTime = this.time) {
      const anchor = this.anchor
      const raw = anchor.positionSec + Math.max(0, contextTime - anchor.contextTime)
      const passes = Math.floor(raw / this.loop.lengthSec)
      return {
        positionSec: raw - passes * this.loop.lengthSec,
        iteration: anchor.iteration + passes,
        finished: false,
      }
    }

    elapsed(contextTime = this.time): number {
      const anchor = this.anchor
      return this.elapsedAtAnchor + Math.max(0, contextTime - anchor.contextTime)
    }

    contextTimeAtElapsed(elapsedSec: number): number {
      return this.anchor.contextTime + elapsedSec - this.elapsedAtAnchor
    }

    /** Pins again at the clock, on the pass it is in or on a fresh one. */
    repin(fresh: boolean): void {
      const position = this.position()
      this.elapsedAtAnchor = this.elapsed()
      this.anchor = {
        contextTime: this.time,
        positionSec: position.positionSec,
        iteration: fresh ? position.iteration + 1 : position.iteration,
      }
    }
  }

  it('carries its pass numbers on, so starts already handed over keep their names', () => {
    const transport = new MovingTransport()
    const cycle = new Cycle(transport, 10)
    transport.time = 45
    expect(cycle.position()).toEqual({ positionSec: 5, iteration: 4, finished: false })
    transport.repin(false)
    expect(cycle.anchor).toEqual({ contextTime: 45, positionSec: 5, iteration: 4 })
    transport.time = 52
    expect(cycle.position()).toEqual({ positionSec: 2, iteration: 5, finished: false })
    expect(cycle.contextTimeAt(2, 5)).toBe(52)
  })

  it('starts its numbers again when the transport took a fresh one', () => {
    const transport = new MovingTransport()
    const cycle = new Cycle(transport, 10)
    transport.time = 45
    expect(cycle.position().iteration).toBe(4)
    transport.repin(true)
    expect(cycle.anchor).toEqual({ contextTime: 45, positionSec: 5, iteration: 5 })
  })
})
