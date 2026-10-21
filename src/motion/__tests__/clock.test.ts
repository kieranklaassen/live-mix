import { describe, expect, it } from 'vitest'

import { steadyClock } from '../clock'

// An audio clock as a browser reports it: the true time, rounded down to the
// 128 samples at 48 kHz the audio thread moves in. Read once per frame of a
// 120 Hz display whose frames arrive a millisecond early or late, it steps by
// 5.3, 8 or 10.7 ms where the frame took about 8.3. (Measured in a video editor's preview:
// steps of 5.3 to 13.3 ms.)
const QUANTUM = 128 / 48000
const FRAME = 1000 / 120
const LATE = [0, 1.4, -1.2, 0.6, -0.8]
const audioClock = (seconds: number): number => Math.floor(seconds / QUANTUM) * QUANTUM
/** When frame `frame` is drawn, in milliseconds. */
const frameAt = (frame: number): number => 1000 + frame * FRAME + LATE[frame % LATE.length]

/** Reads a clock at each frame for `frames` frames, from `start` seconds, and gives the raw and the steady readings with when each was taken. */
function played(frames: number, start = 3, clock = steadyClock()) {
  const raw: number[] = []
  const steady: number[] = []
  const nows: number[] = []
  for (let frame = 0; frame < frames; frame += 1) {
    const now = frameAt(frame)
    const reading = audioClock(start + (now - 1000) / 1000)
    nows.push(now)
    raw.push(reading)
    steady.push(clock.read(reading, now))
  }
  return { raw, steady, nows }
}

const steps = (times: number[]): number[] =>
  times.slice(1).map((time, index) => (time - times[index]) * 1000)
const spread = (values: number[]): number => Math.max(...values) - Math.min(...values)
/** How far each time is from the display's own, in milliseconds: constant for a clock that runs with the display. */
const against = (times: number[], nows: number[]): number[] =>
  times.map((time, index) => time * 1000 - nows[index])

describe('a steady clock', () => {
  it('takes its first reading as it is', () => {
    expect(steadyClock().read(3.21, 5000)).toBe(3.21)
  })

  it('steps evenly with the display where the clock it reads steps unevenly', () => {
    const { raw, steady, nows } = played(600)

    // The clock itself moves by 5.3 to 10.7 ms a frame, up to 2.7 ms away from the display's time.
    expect(spread(steps(raw))).toBeGreaterThan(5)
    expect(spread(against(raw, nows))).toBeGreaterThan(2.5)
    // Steadied, it runs with the display to within a third of a millisecond, and never stands still or goes back.
    expect(spread(against(steady.slice(120), nows.slice(120)))).toBeLessThan(0.35)
    for (const step of steps(steady)) expect(step).toBeGreaterThan(0)
  })

  it('stays with the clock it reads: it does not drift away over a minute', () => {
    const { raw, steady } = played(120 * 60)

    for (let frame = 600; frame < raw.length; frame += 240)
      expect(Math.abs(steady[frame] - raw[frame])).toBeLessThan(0.004)
  })

  it('follows a clock that runs a little fast or slow instead of holding its own pace', () => {
    const clock = steadyClock()
    let last = 0
    // A clock that gains 1% on the display.
    for (let frame = 0; frame < 2400; frame += 1)
      last = clock.read(1.01 * ((frame * FRAME) / 1000), frame * FRAME)

    expect(Math.abs(last - 1.01 * ((2399 * FRAME) / 1000))).toBeLessThan(0.005)
    expect(Math.abs(last - (2399 * FRAME) / 1000)).toBeGreaterThan(0.1)
  })

  it('takes a jump at once: a seek is not eased into', () => {
    const clock = steadyClock()
    played(60, 3, clock)

    expect(clock.read(20, frameAt(60))).toBe(20)
    expect(clock.read(1, frameAt(61))).toBe(1)
  })

  it('takes the next reading as it is after it is reset', () => {
    const clock = steadyClock()
    played(60, 3, clock)
    clock.reset()

    expect(clock.read(3.5001, frameAt(60))).toBe(3.5001)
  })

  it('does not run on past a clock that has stopped, and never goes back when it starts again', () => {
    const clock = steadyClock()
    played(120, 3, clock)
    // The clock stands still for 300 ms, as it does until the first sound is heard, then runs again.
    const stoppedAt = frameAt(120)
    const stopped = audioClock(3 + (stoppedAt - 1000) / 1000)
    const times: number[] = []
    for (let frame = 120; frame < 156; frame += 1) times.push(clock.read(stopped, frameAt(frame)))
    for (let frame = 156; frame < 276; frame += 1)
      times.push(
        clock.read(stopped + audioClock((frameAt(frame) - frameAt(156)) / 1000), frameAt(frame)),
      )

    for (const time of times.slice(0, 36)) expect(time - stopped).toBeLessThanOrEqual(0.0101)
    for (const step of steps(times)) expect(step).toBeGreaterThanOrEqual(0)
    expect(
      Math.abs(
        times[times.length - 1] - (stopped + audioClock((frameAt(275) - frameAt(156)) / 1000)),
      ),
    ).toBeLessThan(0.004)
  })

  it('gives the same times for the same readings', () => {
    expect(played(300).steady).toEqual(played(300).steady)
  })

  it('reads the same within one frame, however often it is asked', () => {
    const clock = steadyClock()
    played(120, 3, clock)
    const now = frameAt(120)
    const reading = audioClock(3 + (now - 1000) / 1000)
    const first = clock.read(reading, now)

    expect(clock.read(reading, now)).toBeCloseTo(first, 12)
    expect(clock.read(reading, now)).toBeCloseTo(first, 12)
  })
})

// A clock that runs at a rate, as a transport played fast does: its time moves `rate` seconds a second.
describe('a steady clock that follows a rate', () => {
  /** Reads a clock running at `rate` for frames `from` to `to`, at `at` seconds of its time when frame `from` is drawn. */
  function playedAt(
    rate: number,
    from: number,
    to: number,
    at: number,
    clock: ReturnType<typeof steadyClock>,
  ) {
    const raw: number[] = []
    const steady: number[] = []
    const nows: number[] = []
    for (let frame = from; frame < to; frame += 1) {
      const now = frameAt(frame)
      const reading = audioClock(at + (rate * (now - frameAt(from))) / 1000)
      nows.push(now)
      raw.push(reading)
      steady.push(clock.read(reading, now, rate))
    }
    return { raw, steady, nows }
  }
  /** How far each time is from the display's time at the rate, in milliseconds: constant for a clock that runs with it. */
  const againstAt = (rate: number, times: number[], nows: number[]): number[] =>
    times.map((time, index) => time * 1000 - rate * nows[index])

  it('at 2x, readings every 8 ms that advance 16 ms give times that advance evenly, with no reset', () => {
    const clock = steadyClock()
    const steady: number[] = []
    for (let frame = 0; frame < 240; frame += 1)
      steady.push(clock.read(3 + (frame * 16) / 1000, 1000 + frame * 8, 2))

    for (const step of steps(steady)) expect(step).toBeCloseTo(16, 6)
    expect(steady[steady.length - 1]).toBeCloseTo(3 + (239 * 16) / 1000, 9)
  })

  it('at 3x, readings in 2.7 ms audio steps come out even', () => {
    const { raw, steady, nows } = playedAt(3, 0, 600, 3, steadyClock())

    expect(spread(againstAt(3, raw, nows))).toBeGreaterThan(2.5)
    expect(spread(againstAt(3, steady.slice(120), nows.slice(120)))).toBeLessThan(1)
    for (const step of steps(steady)) expect(step).toBeGreaterThan(0)
    for (let frame = 120; frame < raw.length; frame += 60)
      expect(Math.abs(steady[frame] - raw[frame])).toBeLessThan(0.006)
  })

  it('glides from 1.5x to 2x: a change of rate alone is not a jump', () => {
    const clock = steadyClock()
    const before = playedAt(1.5, 0, 240, 3, clock)
    const at = before.raw[before.raw.length - 1] + (1.5 * (frameAt(240) - frameAt(239))) / 1000
    const after = playedAt(2, 240, 480, at, clock)
    const steady = [...before.steady, ...after.steady]

    // Every step is between the slow and the fast pace of a frame, give or take a frame's lateness: none is a jump.
    for (const step of steps(steady)) {
      expect(step).toBeGreaterThan(1.5 * (FRAME - 2.7))
      expect(step).toBeLessThan(2 * (FRAME + 2.7))
    }
    expect(spread(againstAt(2, after.steady.slice(120), after.nows.slice(120)))).toBeLessThan(1)
  })

  it('takes a seek at once at any rate', () => {
    for (const rate of [1.5, 2, 3]) {
      const clock = steadyClock()
      playedAt(rate, 0, 60, 3, clock)

      expect(clock.read(20, frameAt(60), rate)).toBe(20)
      expect(clock.read(1, frameAt(61), rate)).toBe(1)
    }
  })

  it('runs ahead of a clock that has stopped by a lead that scales with the rate', () => {
    const clock = steadyClock()
    const { raw } = playedAt(2, 0, 120, 3, clock)
    const stopped = raw[raw.length - 1]
    const times: number[] = []
    for (let frame = 120; frame < 160; frame += 1)
      times.push(clock.read(stopped, frameAt(frame), 2))

    for (const time of times) expect(time - stopped).toBeLessThanOrEqual(0.0201)
    expect(Math.max(...times) - stopped).toBeGreaterThan(0.0101)
    for (const step of steps(times)) expect(step).toBeGreaterThanOrEqual(0)
  })

  it('at a rate of 1 gives the same times as with no rate', () => {
    const plain = played(300).steady
    const clock = steadyClock()
    const atOne = played(300).raw.map((reading, frame) => clock.read(reading, frameAt(frame), 1))

    expect(atOne).toEqual(plain)
  })
})
