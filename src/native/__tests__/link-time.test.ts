import { describe, expect, it } from 'vitest'

import {
  LinkClockOffset,
  OutputClock,
  idleLinkState,
  linkBeatAt,
  linkMicrosAtBeat,
  linkPhase,
  nextBeatInPhase,
  outputClockOffsetMs,
} from '../link-time'

describe('beats of a Link session', () => {
  const state = { beat: 10, micros: 2_000_000, bpm: 120 }

  it('counts beats from one beat at one moment by the tempo', () => {
    expect(linkBeatAt(state, 2_000_000)).toBe(10)
    expect(linkBeatAt(state, 2_500_000)).toBe(11)
    expect(linkBeatAt(state, 1_000_000)).toBe(8)
    expect(linkBeatAt({ ...state, bpm: 90 }, 4_000_000)).toBe(13)
  })

  it('goes back from a beat to its moment', () => {
    expect(linkMicrosAtBeat(state, 11)).toBe(2_500_000)
    expect(linkMicrosAtBeat(state, linkBeatAt(state, 3_141_592))).toBeCloseTo(3_141_592, 6)
  })

  it('reads the place in the bar, on either side of zero', () => {
    expect(linkPhase(9.5, 4)).toBe(1.5)
    expect(linkPhase(-0.5, 4)).toBe(3.5)
    expect(linkPhase(8, 4)).toBe(0)
    expect(linkPhase(3, 0)).toBe(0)
  })

  it('finds the next beat that sits where another does in the bar', () => {
    // From 9.25, the next place like beat 0 is the downbeat at 12.
    expect(nextBeatInPhase(9.25, 0, 4)).toBe(12)
    // Like beat 18 (the third beat of a bar): 10.
    expect(nextBeatInPhase(9.25, 18, 4)).toBe(10)
    // Already there: no wait.
    expect(nextBeatInPhase(12, 0, 4)).toBe(12)
    expect(nextBeatInPhase(12, 64, 4)).toBe(12)
    // A rounding hair short of the place is the place, not a bar's wait.
    expect(nextBeatInPhase(12 + 1e-12, 0, 4)).toBeCloseTo(12, 9)
  })

  it('has a state for a host with no Link', () => {
    expect(idleLinkState()).toMatchObject({
      available: false,
      enabled: false,
      bpm: 120,
      quantum: 4,
    })
    expect(idleLinkState(true).available).toBe(true)
  })
})

describe('LinkClockOffset', () => {
  it('is zero and unknown before any round trip', () => {
    const clock = new LinkClockOffset()
    expect(clock.known).toBe(false)
    expect(clock.hostMicrosAt(12)).toBe(12_000)
  })

  it('puts the host reading in the middle of the round trip', () => {
    const clock = new LinkClockOffset()
    // Sent at 100 ms, back at 102 ms; the host read 9 000 101 000 µs.
    clock.add(100, 102, 9_000_101_000)
    expect(clock.known).toBe(true)
    expect(clock.offsetMicros).toBe(9_000_000_000)
    expect(clock.hostMicrosAt(200)).toBe(9_000_200_000)
    expect(clock.localMsAt(9_000_200_000)).toBe(200)
    expect(clock.tripMs).toBe(2)
  })

  it('trusts the shortest recent trip: a slow answer cannot move it', () => {
    const clock = new LinkClockOffset()
    clock.add(0, 0.4, 5_000_200) // offset 5 000 000
    clock.add(10, 30, 5_029_000) // a 20 ms trip, read late: would say 5 009 000
    expect(clock.offsetMicros).toBe(5_000_000)
    clock.add(40, 40.2, 5_040_150) // shorter still: 5 000 050
    expect(clock.offsetMicros).toBe(5_000_050)
  })

  it('lets old trips go, so two drifting clocks are followed', () => {
    const clock = new LinkClockOffset(3)
    clock.add(0, 0.1, 1_000_050) // the best trip of all, but old
    for (let i = 1; i <= 3; i += 1)
      clock.add(i * 1000, i * 1000 + 1, 1_000_500 + i * 1000_000 + i * 20)
    // Only the last three count: each says the clocks are 20 µs further apart.
    expect(clock.offsetMicros).toBe(1_000_060)
  })

  it('ignores a reading that makes no sense', () => {
    const clock = new LinkClockOffset()
    clock.add(10, 5, 1)
    clock.add(0, 1, Number.NaN)
    expect(clock.known).toBe(false)
  })
})

describe('when a context is heard', () => {
  it('uses the browser pairing of context time and page time', () => {
    const context = {
      currentTime: 5,
      getOutputTimestamp: () => ({ contextTime: 4.9, performanceTime: 20_000 }),
    }
    // Context 4.9 s is heard at page 20 000 ms: page minus context is 15 100 ms.
    expect(outputClockOffsetMs(context, 20_050)).toBeCloseTo(15_100, 9)
  })

  it('falls back to the reported latency where the browser pairs nothing', () => {
    const context = { currentTime: 5, outputLatency: 0.02, getOutputTimestamp: () => ({}) }
    // What is heard now was rendered 20 ms ago: context 4.98 at page 30 000.
    expect(outputClockOffsetMs(context, 30_000)).toBeCloseTo(25_020, 9)
    expect(outputClockOffsetMs({ currentTime: 5, baseLatency: 0.01 }, 30_000)).toBeCloseTo(
      25_010,
      9,
    )
  })

  it('settles on the middle of its readings', () => {
    const readings = [100, 100.2, 99.9, 140, 100.1]
    let index = 0
    const context = {
      currentTime: 0,
      getOutputTimestamp: () => ({ contextTime: 1, performanceTime: 1000 + readings[index++ % 5] }),
    }
    const clock = new OutputClock(context, { now: () => 0 })
    for (let i = 0; i < 5; i += 1) clock.sample()
    // One late callback (140) is outvoted.
    expect(clock.offsetMs).toBeCloseTo(100.1, 9)
    expect(clock.localMsAt(2)).toBeCloseTo(2100.1, 9)
    expect(clock.contextTimeAt(2100.1)).toBeCloseTo(2, 9)
  })

  it('follows the output when it really moves, after three readings that agree', () => {
    let offset = 100
    const context = {
      currentTime: 0,
      getOutputTimestamp: () => ({ contextTime: 1, performanceTime: 1000 + offset }),
    }
    const clock = new OutputClock(context, { now: () => 0 })
    for (let i = 0; i < 15; i += 1) clock.sample()
    // The device dropped a buffer: everything is heard 10 ms later from here on.
    offset = 110
    clock.sample()
    clock.sample()
    expect(clock.offsetMs).toBe(100)
    clock.sample()
    expect(clock.offsetMs).toBe(110)
    // Wobble well under the step moves nothing.
    offset = 110.4
    for (let i = 0; i < 3; i += 1) clock.sample()
    expect(Math.abs(clock.offsetMs - 110)).toBeLessThan(0.5)
  })

  it('does not take two late readings and a third somewhere else for a move', () => {
    const readings = [...new Array<number>(15).fill(100), 110, 110, 104, 110, 100, 110]
    let index = 0
    const context = {
      currentTime: 0,
      getOutputTimestamp: () => ({ contextTime: 1, performanceTime: 1000 + readings[index++] }),
    }
    const clock = new OutputClock(context, { now: () => 0 })
    readings.forEach(() => clock.sample())
    expect(clock.offsetMs).toBe(100)
  })
})
