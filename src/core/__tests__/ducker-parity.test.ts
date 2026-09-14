// Legacy (main-thread poll, setTargetAtTime) versus worklet (DuckerKernel)
// ducker on the same key: a 0.5 RMS burst then silence. The legacy gain is
// reconstructed from its recorded `setTargetAtTime` events with the Web Audio
// law `v(t) = V1 + (V0 - V1)·exp(-(t - T0)/τ)`; the worklet gain is the
// kernel's per-sample output. Both share the constants, so the trajectories
// agree once the legacy's poll latency (0–60 ms, the follower only observes
// the key every ENV_POLL_MS) is taken into account.

import { describe, expect, it, vi } from 'vitest'

import { asAudioContext, createMockContext } from '../../testing'
import { DUCK_DEPTH, Ducker, ENV_POLL_MS } from '../devices/native/Ducker'
import { DuckerKernel } from '../devices/native/DuckerKernel'

const SAMPLE_RATE = 48_000
const BLOCK = 128
const KEY_LEVEL = 0.5
const BURST_SEC = 1.5
const TOTAL_SEC = 5
const GRID_MS = 1

interface TargetEvent {
  target: number
  at: number
  timeConstant: number
}

/** Drive the real legacy Ducker deterministically: one poll every ENV_POLL_MS. */
function legacyGain(): { gain: (t: number) => number; events: TargetEvent[]; timers: number } {
  const ctx = createMockContext({ sampleRate: SAMPLE_RATE })
  const duck = ctx.createGain()
  let now = 0
  const setIntervalFn = vi.fn(() => 1 as unknown as ReturnType<typeof setInterval>)
  const ducker = new Ducker(asAudioContext(ctx), {
    target: duck.gain as unknown as AudioParam,
    clock: { now: () => now, setIntervalFn, clearIntervalFn: () => {} },
  })
  const key = ctx.createGain()
  ducker.key(key as unknown as AudioNode)
  const analyser = ctx.analysers[0]
  const polls = Math.floor((TOTAL_SEC * 1000) / ENV_POLL_MS)
  for (let k = 1; k <= polls; k += 1) {
    now = (k * ENV_POLL_MS) / 1000
    analyser.level = now <= BURST_SEC ? KEY_LEVEL : 0
    ducker.poll()
  }
  const events: TargetEvent[] = duck.gain.eventsFor('setTargetAtTime').map((event) => ({
    target: event.args[0] as number,
    at: event.args[1] as number,
    timeConstant: event.args[2] as number,
  }))
  // Segment start values: each event continues from where the previous curve was.
  const startValues: number[] = []
  let value = 1
  for (let i = 0; i < events.length; i += 1) {
    startValues.push(value)
    const next = events[i + 1]
    if (next) {
      const { target, at, timeConstant } = events[i]
      value = target + (value - target) * Math.exp(-(next.at - at) / timeConstant)
    }
  }
  const gain = (t: number): number => {
    let index = -1
    for (let i = 0; i < events.length && events[i].at <= t; i += 1) index = i
    if (index < 0) return 1
    const { target, at, timeConstant } = events[index]
    return target + (startValues[index] - target) * Math.exp(-(t - at) / timeConstant)
  }
  return { gain, events, timers: setIntervalFn.mock.calls.length }
}

/** Run the kernel on the same key and return the gain on the grid. */
function workletGain(): { gain: (t: number) => number; samples: Float32Array } {
  const kernel = new DuckerKernel(SAMPLE_RATE)
  const totalFrames = TOTAL_SEC * SAMPLE_RATE
  const samples = new Float32Array(totalFrames)
  const key = new Float32Array(BLOCK)
  const gains = new Float32Array(BLOCK)
  for (let start = 0; start < totalFrames; start += BLOCK) {
    for (let i = 0; i < BLOCK; i += 1)
      key[i] = (start + i) / SAMPLE_RATE < BURST_SEC ? KEY_LEVEL : 0
    kernel.renderGain([key], gains, BLOCK)
    samples.set(gains, start)
  }
  const gain = (t: number): number =>
    samples[Math.min(totalFrames - 1, Math.round(t * SAMPLE_RATE))]
  return { gain, samples }
}

function grid(): number[] {
  const points: number[] = []
  for (let ms = 0; ms < TOTAL_SEC * 1000; ms += GRID_MS) points.push(ms / 1000)
  return points
}

const dB = (gain: number): number => 20 * Math.log10(gain)

/** First grid time at which `predicate(gain(t))` holds, searching from `from`. */
function firstTime(
  gain: (t: number) => number,
  from: number,
  predicate: (g: number) => boolean,
): number {
  for (const t of grid()) if (t >= from && predicate(gain(t))) return t
  return Number.POSITIVE_INFINITY
}

describe('legacy Ducker vs worklet DuckerKernel on the same key (U17)', () => {
  const legacy = legacyGain()
  const worklet = workletGain()
  const floor = 1 - DUCK_DEPTH

  it('the worklet path schedules no timers; the legacy path needs one interval', () => {
    expect(legacy.timers).toBe(1)
    // The kernel is plain arithmetic over blocks: nothing to spy on but the
    // absence of a clock dependency in its constructor and process signature.
    expect(new DuckerKernel(SAMPLE_RATE)).not.toHaveProperty('clock')
  })

  it('both settle at the same ducked floor and both return to unity', () => {
    expect(legacy.gain(BURST_SEC - 0.05)).toBeCloseTo(floor, 5)
    expect(worklet.gain(BURST_SEC - 0.05)).toBeCloseTo(floor, 5)
    expect(legacy.gain(TOTAL_SEC - 0.01)).toBeGreaterThan(0.97)
    expect(worklet.gain(TOTAL_SEC - 0.01)).toBeGreaterThan(0.97)
  })

  it('gain trajectories match within tolerance once the poll latency is removed', () => {
    let best = { shiftMs: 0, maxError: Number.POSITIVE_INFINITY, meanError: 0 }
    for (let shiftMs = 0; shiftMs <= ENV_POLL_MS; shiftMs += 1) {
      let maxError = 0
      let sum = 0
      let count = 0
      for (const t of grid()) {
        if (t + shiftMs / 1000 >= TOTAL_SEC) break
        const error = Math.abs(worklet.gain(t) - legacy.gain(t + shiftMs / 1000))
        maxError = Math.max(maxError, error)
        sum += error
        count += 1
      }
      if (maxError < best.maxError) best = { shiftMs, maxError, meanError: sum / count }
    }
    // The worklet leads by less than one poll period (it observes the key
    // continuously; the poll observes it 0–60 ms late, 30 ms on average).
    expect(best.shiftMs).toBeGreaterThan(0)
    expect(best.shiftMs).toBeLessThan(ENV_POLL_MS)
    // Onset is where the 60 ms sample-and-hold of the legacy target shows.
    expect(best.maxError).toBeLessThan(0.06)
    expect(best.meanError).toBeLessThan(0.005)

    // Unshifted, the two never disagree by more than the depth of one poll's move.
    let rawMax = 0
    for (const t of grid()) rawMax = Math.max(rawMax, Math.abs(worklet.gain(t) - legacy.gain(t)))
    expect(rawMax).toBeLessThan(0.3)
  })

  it('release trajectories match closely without any alignment', () => {
    let maxError = 0
    for (const t of grid()) {
      if (t < BURST_SEC + 0.1) continue
      maxError = Math.max(maxError, Math.abs(worklet.gain(t) - legacy.gain(t)))
    }
    expect(maxError).toBeLessThan(0.025)
  })

  it('ducks and recovers at least as fast as the legacy, within one poll period (AE9)', () => {
    const dip6 = (g: (t: number) => number) => firstTime(g, 0, (v) => dB(v) <= -6)
    const dip9 = (g: (t: number) => number) => firstTime(g, 0, (v) => dB(v) <= -9)
    const recover1 = (g: (t: number) => number) => firstTime(g, BURST_SEC, (v) => dB(v) >= -1)
    const poll = ENV_POLL_MS / 1000

    expect(dip6(worklet.gain)).toBeLessThanOrEqual(dip6(legacy.gain))
    expect(dip6(legacy.gain) - dip6(worklet.gain)).toBeLessThanOrEqual(poll)
    expect(dip9(worklet.gain)).toBeLessThanOrEqual(dip9(legacy.gain))
    expect(dip9(legacy.gain) - dip9(worklet.gain)).toBeLessThanOrEqual(poll)
    expect(Math.abs(recover1(worklet.gain) - recover1(legacy.gain))).toBeLessThanOrEqual(poll)

    // −6 dB inside a few attack constants; −9 dB (floor is −9.9 dB) within 0.3 s.
    expect(dip6(worklet.gain)).toBeLessThan(0.2)
    expect(dip9(worklet.gain)).toBeLessThan(0.3)
  })
})
