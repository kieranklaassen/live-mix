// Engine wiring for U19 (automation lanes + modulation control loop) and U18
// (sample retention, element tracks, unlock on the output gesture).

import { describe, expect, it, vi } from 'vitest'

import { MockAudioBuffer, asAudioContext, createMockContext } from '../../testing'
import { audioParamTarget } from '../automation/ModMatrix'
import { Lfo } from '../automation/Modulator'
import { ParamLane } from '../automation/ParamLane'
import { createEngine } from '../Engine'
import { ElementSource } from '../sources/ElementSource'
import { type Clip } from '../clips/Clip'

type Timer = { cb: () => void; ms: number; id: number }

/** Injected timers: `fire(ms)` runs every interval registered with that period. */
function fakeTimers() {
  const intervals = new Map<number, Timer>()
  let next = 1
  return {
    intervals,
    setIntervalFn: vi.fn((cb: () => void, ms: number) => {
      const id = next++
      intervals.set(id, { cb, ms, id })
      return id as unknown as ReturnType<typeof setInterval>
    }),
    clearIntervalFn: vi.fn((id: ReturnType<typeof setInterval>) => {
      intervals.delete(id as unknown as number)
    }),
    fire(ms: number) {
      for (const timer of intervals.values()) if (timer.ms === ms) timer.cb()
    },
  }
}

function clip(id: string, startSec: number, sourceId = `s-${id}`): Clip {
  return {
    id,
    sourceId,
    startSec,
    offsetSec: 0,
    durationSec: 2,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear',
    gainDb: 0,
  }
}

describe('Engine automation control loop (U19 wiring)', () => {
  it('starts no timer until a lane, a route or playback asks for one', () => {
    const ctx = createMockContext()
    const timers = fakeTimers()
    const engine = createEngine({ context: asAudioContext(ctx), ...timers, tickMs: 50 })
    expect(engine.automation.running).toBe(false)
    expect(timers.intervals.size).toBe(0)
    expect(engine.modulation).toBe(engine.automation.modulation)
    engine.dispose()
  })

  it('updates modulation on every control tick, playing or not, once a route exists', () => {
    const ctx = createMockContext({ currentTime: 1 })
    const timers = fakeTimers()
    const engine = createEngine({ context: asAudioContext(ctx), ...timers, tickMs: 50 })
    const gain = ctx.createGain()
    const lfo = new Lfo({ rateHz: 1, depth: 1 })
    engine.modulation.map(lfo, audioParamTarget(gain.gain, { min: 0, max: 1, base: 0.5 }), 0.4)
    expect(engine.automation.running).toBe(true)
    const controlTimer = [...timers.intervals.values()].find((t) => t.ms === 50)
    expect(controlTimer).toBeDefined()

    timers.fire(50)
    expect(gain.gain.events.length).toBeGreaterThan(0)
    const before = gain.gain.events.length
    ctx.currentTime = 1.25
    timers.fire(50)
    expect(gain.gain.events.length).toBeGreaterThan(before)
    engine.dispose()
    expect(engine.automation.running).toBe(false)
  })

  it('writes lanes inside the lookahead while playing and resets them on stop/pause', () => {
    const ctx = createMockContext({ currentTime: 10 })
    const timers = fakeTimers()
    const engine = createEngine({
      context: asAudioContext(ctx),
      ...timers,
      tickMs: 40,
      automation: { lookaheadSec: 1 },
    })
    const gain = ctx.createGain()
    const lane = new ParamLane({
      defaultValue: 0.2,
      breakpoints: [
        { timeSec: 0, value: 0.2 },
        { timeSec: 2, value: 0.8 },
      ],
    })
    const writer = engine.automation.add(lane, gain.gain)
    expect(engine.automation.writers.has(writer)).toBe(true)
    expect(writer.writtenUntilSec).toBeNull()

    // Not playing: the control tick only updates modulation, lanes stay unwritten.
    timers.fire(40)
    expect(writer.writtenUntilSec).toBeNull()

    engine.transport.start()
    // 'start' ticks immediately and the loop keeps writing ahead.
    expect(writer.writtenUntilSec).toBeCloseTo(1)
    const written = gain.gain.events.length
    expect(written).toBeGreaterThan(0)
    ctx.currentTime = 10.5
    timers.fire(40)
    expect(writer.writtenUntilSec).toBeCloseTo(1.5)

    engine.transport.pause()
    expect(writer.writtenUntilSec).toBeNull()

    engine.transport.start()
    ctx.currentTime = 11
    timers.fire(40)
    expect(writer.writtenUntilSec).not.toBeNull()
    engine.transport.stop()
    expect(writer.writtenUntilSec).toBeNull()

    engine.automation.remove(writer)
    expect(engine.automation.writers.size).toBe(0)
    engine.dispose()
  })

  it('a knob override holds the param and stops lane writes until release', () => {
    const ctx = createMockContext({ currentTime: 0 })
    const timers = fakeTimers()
    const engine = createEngine({ context: asAudioContext(ctx), ...timers, tickMs: 40 })
    const gain = ctx.createGain()
    const lane = new ParamLane({
      breakpoints: [
        { timeSec: 0, value: 0 },
        { timeSec: 4, value: 1 },
      ],
    })
    const writer = engine.automation.add(lane, gain.gain)
    engine.transport.start()
    ctx.currentTime = 1
    writer.override(engine.now())
    expect(writer.isOverridden).toBe(true)
    const held = gain.gain.events.length
    ctx.currentTime = 1.5
    timers.fire(40)
    expect(gain.gain.events.length).toBe(held)
    writer.release()
    ctx.currentTime = 2
    timers.fire(40)
    expect(gain.gain.events.length).toBeGreaterThan(held)
    engine.dispose()
  })
})

describe('Engine sample retention and element tracks (U18 wiring)', () => {
  it('gives every audio track a SampleRetainer registered ahead of the track, disposed with it', () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    const track = engine.addAudioTrack('music')
    const retainer = engine.retainerFor(track)
    if (!retainer) throw new Error('expected a retainer')
    expect(retainer.lookaheadSec).toBe(track.lookaheadSec)
    const disposeSpy = vi.spyOn(retainer, 'dispose')
    engine.removeTrack('music')
    expect(disposeSpy).toHaveBeenCalledTimes(1)
    expect(engine.retainerFor(track)).toBeUndefined()

    const bare = createEngine({ context: asAudioContext(ctx), retainSamples: false })
    expect(bare.retainerFor(bare.addAudioTrack('m'))).toBeUndefined()
    bare.dispose()
    engine.dispose()
  })

  it('retains a clip’s sample while it is due and lets the store evict afterwards', async () => {
    const ctx = createMockContext({ sampleRate: 48000 })
    const engine = createEngine({ context: asAudioContext(ctx), samples: { budgetBytes: 1 } })
    const track = engine.addAudioTrack('music', { lookaheadSec: 1 })
    const sample = new MockAudioBuffer(2, 48000, 48000) as unknown as AudioBuffer
    await engine.samples.load('s-a', sample)
    track.clips.add(clip('a', 0.5))
    engine.transport.start()
    engine.scheduler.tick()
    // Over budget, but held by the retainer for the due clip.
    expect(engine.samples.has('s-a')).toBe(true)
    expect(ctx.sources).toHaveLength(1)
    engine.dispose()
  })

  it('addElementTrack mirrors addAudioTrack and activateOutput unlocks its elements', async () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    const elements: { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> }[] = []
    const createAudioElement = () => {
      const element = {
        src: '',
        preload: 'auto',
        crossOrigin: null as string | null,
        loop: false,
        muted: false,
        volume: 1,
        currentTime: 0,
        duration: 30,
        paused: true,
        readyState: 4,
        play: vi.fn(() => Promise.resolve()),
        pause: vi.fn(),
        load: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
      elements.push(element)
      return element as unknown as HTMLMediaElement
    }
    const bed = engine.addElementTrack('beds', {
      sources: [
        new ElementSource(asAudioContext(ctx), { id: 'bed', url: '/bed.mp3', createAudioElement }),
      ],
    })
    expect(engine.elementTrack('beds')).toBe(bed)
    expect(engine.elementTracks).toEqual([bed])
    expect(() => engine.addElementTrack('beds')).toThrow(/already exists/)

    await engine.activateOutput()
    expect(elements).toHaveLength(1)
    expect(elements[0].play).toHaveBeenCalled()

    engine.removeElementTrack('beds')
    expect(engine.elementTracks).toEqual([])
    engine.dispose()
  })
})
