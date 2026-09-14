import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { advance, asAudioContext, configureMocks, createMockContext } from '../../testing'
import { createClock } from '../clock'
import {
  DUCK_DEPTH,
  DUCK_TIME_CONSTANT,
  Ducker,
  ENV_ATTACK_MS,
  ENV_GAIN_SCALE,
  ENV_POLL_MS,
  ENV_RELEASE_MS,
} from '../devices/native/Ducker'

beforeEach(() => {
  vi.useFakeTimers()
  configureMocks({ advanceTimers: vi.advanceTimersByTimeAsync })
})

afterEach(() => {
  configureMocks({})
  vi.useRealTimers()
})

function setup() {
  const ctx = createMockContext()
  const duck = ctx.createGain()
  const ducker = new Ducker(asAudioContext(ctx), {
    target: duck.gain as unknown as AudioParam,
    clock: createClock(asAudioContext(ctx)),
  })
  const voice = ctx.createGain()
  return { ctx, duck, ducker, voice }
}

describe('Ducker (Breathwork Live pollEnvelope parity)', () => {
  it('keys with a 256-point analyser and writes the exact follower value per poll', async () => {
    const { ctx, duck, ducker, voice } = setup()
    ducker.key(voice as unknown as AudioNode)
    const analyser = ctx.analysers[0]
    expect(analyser.fftSize).toBe(256)
    expect(voice.connectCalls.calledWith(analyser)).toBe(true)

    analyser.level = 0.5
    await advance(ctx, ENV_POLL_MS / 1000)
    // rms 0.5 with a fresh follower: attack constant, one step.
    const alpha = 1 - Math.exp(-ENV_POLL_MS / ENV_ATTACK_MS)
    const envelope = 0.5 * alpha
    const expected = 1 - Math.min(envelope * ENV_GAIN_SCALE, 1) * DUCK_DEPTH
    const event = duck.gain.lastEvent('setTargetAtTime')
    expect(event?.args[0]).toBeCloseTo(expected, 10)
    expect(event?.args[1]).toBeCloseTo(ctx.currentTime)
    expect(event?.args[2]).toBe(DUCK_TIME_CONSTANT)
    expect(ducker.envelope).toBeCloseTo(envelope, 10)
  })

  it('ducks fast on voice, releases slowly, and restores on silence (harness case)', async () => {
    const { ctx, duck, ducker, voice } = setup()
    ducker.key(voice as unknown as AudioNode)
    const analyser = ctx.analysers[0]
    const lastTarget = () => duck.gain.lastEvent('setTargetAtTime')?.args[0] as number

    analyser.level = 0.5
    await advance(ctx, (ENV_POLL_MS * 2) / 1000)
    expect(lastTarget()).toBeLessThanOrEqual(1 - DUCK_DEPTH + 0.1)
    const ducked = lastTarget()

    analyser.level = 0
    await advance(ctx, (ENV_POLL_MS * 2) / 1000)
    expect(lastTarget()).toBeLessThan(ducked + 0.15)
    const releaseAlpha = 1 - Math.exp(-ENV_POLL_MS / ENV_RELEASE_MS)
    expect(releaseAlpha).toBeLessThan(0.1)

    await advance(ctx, 5)
    expect(lastTarget()).toBeGreaterThan(0.9)
  })

  it('re-key drops the previous analyser and keeps one poll running; stop ends it', async () => {
    const { ctx, duck, ducker, voice } = setup()
    const second = ctx.createGain()
    ducker.key(voice as unknown as AudioNode)
    ducker.key(second as unknown as AudioNode)
    expect(ctx.analysers[0].disconnectCalls.count).toBe(1)
    expect(second.connectCalls.calledWith(ctx.analysers[1])).toBe(true)
    expect(ducker.keyAnalyser).toBe(ctx.analysers[1])

    ctx.analysers[1].level = 0.2
    await advance(ctx, ENV_POLL_MS / 1000)
    const polls = duck.gain.eventsFor('setTargetAtTime').length
    expect(polls).toBe(1)

    ducker.stop()
    await advance(ctx, 1)
    expect(duck.gain.eventsFor('setTargetAtTime')).toHaveLength(polls)
    ducker.key(voice as unknown as AudioNode)
    await advance(ctx, 1)
    expect(duck.gain.eventsFor('setTargetAtTime')).toHaveLength(polls)
  })

  it('poll() is a no-op before key() and after dispose()', async () => {
    const { ctx, duck, ducker, voice } = setup()
    ducker.poll()
    expect(duck.gain.events).toHaveLength(0)
    ducker.key(voice as unknown as AudioNode)
    ducker.dispose()
    expect(ctx.analysers[0].disconnectCalls.count).toBe(1)
    expect(ducker.keyAnalyser).toBeNull()
    await advance(ctx, 1)
    expect(duck.gain.events).toHaveLength(0)
  })
})
