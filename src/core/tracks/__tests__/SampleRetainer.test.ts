import { describe, expect, it } from 'vitest'

import { MockAudioBuffer, asAudioContext, createMockContext } from '../../../testing'
import { type Clip } from '../../clips/Clip'
import { Scheduler } from '../../transport/Scheduler'
import { Transport } from '../../transport/Transport'
import { AudioTrack } from '../AudioTrack'
import { SampleRetainer } from '../SampleRetainer'
import { SampleStore } from '../SampleStore'

const RATE = 48000
const MINUTE_BYTES = 2 * 60 * RATE * 4

function minutes(seconds: number): AudioBuffer {
  return new MockAudioBuffer(2, seconds * RATE, RATE) as unknown as AudioBuffer
}

function clip(id: string, startSec: number, extra: Partial<Clip> = {}): Clip {
  return {
    id,
    sourceId: `s-${id}`,
    startSec,
    offsetSec: 0,
    durationSec: 4,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear',
    gainDb: 0,
    ...extra,
  }
}

function setup(
  options: {
    budgetBytes?: number
    lookaheadSec?: number
    preloadSec?: number
    graceSec?: number
    loop?: boolean
    resolve?: boolean
  } = {},
) {
  const ctx = createMockContext({ sampleRate: RATE })
  const dest = ctx.createGain()
  const samples = new SampleStore(asAudioContext(ctx), { budgetBytes: options.budgetBytes })
  const track = new AudioTrack(asAudioContext(ctx), {
    name: 'music',
    destination: dest as unknown as AudioNode,
    samples,
    now: () => ctx.currentTime,
    lookaheadSec: options.lookaheadSec ?? 1,
    preloadSec: options.preloadSec ?? 5,
    resolveSource: options.resolve ? () => minutes(60) : undefined,
  })
  const transport = new Transport({
    now: () => ctx.currentTime,
    loop: options.loop ? { enabled: true, lengthSec: 32 } : undefined,
  })
  const scheduler = new Scheduler({ transport, tickMs: 40 })
  // Same order the engine would use: the retainer first, so its hold exists
  // before the track's own preload asks the store to decode.
  const retainer = new SampleRetainer({
    samples,
    track,
    now: () => ctx.currentTime,
    graceSec: options.graceSec,
    scheduler,
  })
  track.attach(scheduler)
  return { ctx, samples, track, transport, scheduler, retainer }
}

describe('SampleRetainer', () => {
  it('holds a sample from the preload window until the clip has ended plus grace', async () => {
    const { ctx, samples, track, transport, scheduler, retainer } = setup()
    await samples.load('s-a', minutes(60))
    track.clips.add(clip('a', 10))
    expect(retainer.lookaheadSec).toBe(5)
    transport.start()
    scheduler.tick()
    expect(samples.holds('s-a')).toBe(0)

    ctx.currentTime = 5.5
    scheduler.tick()
    expect(samples.holds('s-a')).toBe(1)
    expect(retainer.heldKeys()).toEqual(['a:0:10.000'])
    expect(retainer.heldSourceIds()).toEqual(['s-a'])
    expect(samples.isEvictable('s-a')).toBe(false)

    // Playing (10–14) and through the 1 s grace: still held.
    ctx.currentTime = 14.5
    scheduler.tick()
    expect(samples.holds('s-a')).toBe(1)
    ctx.currentTime = 15
    scheduler.tick()
    expect(samples.holds('s-a')).toBe(0)
    expect(retainer.heldKeys()).toEqual([])
    scheduler.dispose()
  })

  it('keeps what is about to play out of budget eviction while older samples go', async () => {
    const { ctx, samples, track, transport, scheduler } = setup({
      budgetBytes: 2 * MINUTE_BYTES,
      resolve: true,
    })
    // Two tracks already cached and idle.
    await samples.load('old-1', minutes(60))
    await samples.load('old-2', minutes(60))
    track.clips.add(clip('a', 3))
    track.clips.add(clip('b', 4.5))
    transport.start()
    // Tick 1: both clips are inside the 5 s preload window: held, then decoded.
    scheduler.tick()
    expect(samples.holds('s-a')).toBe(1)
    expect(samples.holds('s-b')).toBe(1)
    await samples.loading('s-a')
    await samples.loading('s-b')
    // The budget is two minutes: the idle ones went, the held ones stayed.
    expect(samples.ids()).toEqual(['s-a', 's-b'])
    expect(samples.metrics.evictions).toBe(2)

    // A third, idle load cannot push out either held sample.
    await samples.load('extra', minutes(60))
    expect(samples.ids()).toEqual(['s-a', 's-b', 'extra'])
    expect(samples.metrics.overBudget).toBe(true)

    // Once `a` (3–7) has ended and its grace passed, it is the one to go; `b`
    // (4.5–8.5) is still inside its grace.
    ctx.currentTime = 8.5
    scheduler.tick()
    expect(samples.holds('s-a')).toBe(0)
    expect(samples.holds('s-b')).toBe(1)
    expect([...samples.ids()].sort()).toEqual(['extra', 's-b'])
    expect(samples.metrics.evictions).toBe(3)
    scheduler.dispose()
  })

  it('a moved clip releases the old hold and takes one under the new key', async () => {
    const { ctx, samples, track, transport, scheduler, retainer } = setup()
    await samples.load('s-a', minutes(60))
    track.clips.add(clip('a', 3))
    transport.start()
    scheduler.tick()
    expect(retainer.heldKeys()).toEqual(['a:0:3.000'])
    track.clips.update('a', { startSec: 4 })
    expect(retainer.heldKeys()).toEqual(['a:0:4.000'])
    expect(samples.holds('s-a')).toBe(1)
    track.clips.remove('a')
    expect(retainer.heldKeys()).toEqual([])
    expect(samples.holds('s-a')).toBe(0)
    ctx.currentTime = 0
    scheduler.dispose()
  })

  it('cancelPending releases only holds whose start has not come', async () => {
    const { ctx, samples, track, transport, scheduler, retainer } = setup()
    await samples.load('s-a', minutes(60))
    await samples.load('s-b', minutes(60))
    track.clips.add(clip('a', 1))
    track.clips.add(clip('b', 4))
    transport.start()
    scheduler.tick()
    expect(retainer.heldKeys()).toEqual(['a:0:1.000', 'b:0:4.000'])
    ctx.currentTime = 2
    scheduler.cancelPending()
    expect(retainer.heldKeys()).toEqual(['a:0:1.000'])
    expect(samples.holds('s-a')).toBe(1)
    expect(samples.holds('s-b')).toBe(0)
    // The scheduler re-derives what it cancelled.
    scheduler.tick()
    expect(samples.holds('s-b')).toBe(1)
    scheduler.dispose()
  })

  it('pause, stop and seek release every hold; play takes them again', async () => {
    const { ctx, samples, track, transport, scheduler } = setup()
    await samples.load('s-a', minutes(60))
    track.clips.add(clip('a', 1))
    transport.start()
    scheduler.tick()
    expect(samples.holds('s-a')).toBe(1)
    transport.pause()
    expect(samples.holds('s-a')).toBe(0)

    transport.start()
    scheduler.tick()
    expect(samples.holds('s-a')).toBe(1)
    ctx.currentTime = 0.5
    transport.stop({ fadeSec: 0.75 })
    expect(samples.holds('s-a')).toBe(0)

    transport.start()
    scheduler.tick()
    expect(samples.holds('s-a')).toBe(1)
    transport.seek(20)
    expect(samples.holds('s-a')).toBe(0)
    scheduler.dispose()
  })

  it('loop: each pass holds under its own key and lets go after its clip', async () => {
    const { ctx, samples, track, transport, scheduler, retainer } = setup({ loop: true })
    await samples.load('s-a', minutes(60))
    track.clips.add(clip('a', 0.5, { durationSec: 1 }))
    transport.start()
    scheduler.tick()
    expect(retainer.heldKeys()).toEqual(['a:0:0.500'])
    ctx.currentTime = 28
    scheduler.tick()
    expect(retainer.heldKeys()).toEqual(['a:1:0.500'])
    expect(samples.holds('s-a')).toBe(1)
    scheduler.dispose()
  })

  it('detach and dispose release holds; a missing clip is accepted without a hold', async () => {
    const { ctx, samples, track, transport, scheduler, retainer } = setup()
    await samples.load('s-a', minutes(60))
    track.clips.add(clip('a', 1))
    transport.start()
    scheduler.tick()
    expect(samples.holds('s-a')).toBe(1)
    retainer.dispose()
    expect(samples.holds('s-a')).toBe(0)
    expect(retainer.schedule({ clipId: 'ghost', iteration: 0, startSec: 0 }, 0)).toBe(true)
    expect(retainer.heldKeys()).toEqual([])
    ctx.currentTime = 0
    scheduler.dispose()
  })

  it('a start scheduled twice under one key holds once', async () => {
    const { samples, track, retainer } = setup()
    await samples.load('s-a', minutes(60))
    track.clips.add(clip('a', 1))
    const start = { clipId: 'a', iteration: 0, startSec: 1 }
    retainer.schedule(start, 1)
    retainer.schedule(start, 1)
    expect(samples.holds('s-a')).toBe(1)
    retainer.cancel('a:0:1.000')
    expect(samples.holds('s-a')).toBe(0)
  })
})
