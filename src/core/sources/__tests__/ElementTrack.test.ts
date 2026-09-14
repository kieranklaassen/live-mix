import { describe, expect, it } from 'vitest'

import {
  MockAudioBuffer,
  asAudioContext,
  asMediaElement,
  createMockContext,
  createMockMediaElement,
  type MockMediaElement,
} from '../../../testing'
import { type Clip, type FadeCurve } from '../../clips/Clip'
import { equalPowerFadeIn, equalPowerFadeOut } from '../../clips/curves'
import { fadeGain } from '../../clips/fade'
import { AudioTrack, CROSSFADE_SECONDS } from '../../tracks/AudioTrack'
import { SampleStore } from '../../tracks/SampleStore'
import { Scheduler } from '../../transport/Scheduler'
import { Transport } from '../../transport/Transport'
import { ElementSource } from '../ElementSource'
import { ELEMENT_DRIFT_TOLERANCE_SECONDS, ElementTrack, type TimeoutId } from '../ElementTrack'

/** Timers on the mock audio clock: `fireDue()` runs what is due at `currentTime`. */
class FakeTimers {
  private queue: { id: number; at: number; callback: () => void }[] = []
  private nextId = 1

  constructor(private readonly clock: () => number) {}

  readonly set = (callback: () => void, ms: number): TimeoutId => {
    const id = this.nextId++
    this.queue.push({ id, at: this.clock() + ms / 1000, callback })
    return id as unknown as TimeoutId
  }

  readonly clear = (id: TimeoutId): void => {
    this.queue = this.queue.filter((timer) => timer.id !== (id as unknown as number))
  }

  get pending(): number {
    return this.queue.length
  }

  fireDue(): void {
    const now = this.clock()
    const due = this.queue
      .filter((timer) => timer.at <= now)
      .sort((a, b) => a.at - b.at || a.id - b.id)
    this.queue = this.queue.filter((timer) => timer.at > now)
    for (const timer of due) timer.callback()
  }
}

function setup(options: { currentTime?: number; lookaheadSec?: number; preloadSec?: number } = {}) {
  const ctx = createMockContext({ currentTime: options.currentTime ?? 0, sampleRate: 48000 })
  const dest = ctx.createGain()
  const timers = new FakeTimers(() => ctx.currentTime)
  const track = new ElementTrack(asAudioContext(ctx), {
    name: 'bed',
    destination: dest as unknown as AudioNode,
    now: () => ctx.currentTime,
    lookaheadSec: options.lookaheadSec,
    preloadSec: options.preloadSec,
    setTimeoutFn: timers.set,
    clearTimeoutFn: timers.clear,
  })
  const elements: MockMediaElement[] = []
  const source = (id: string) => {
    const element = createMockMediaElement({ duration: 2700 })
    elements.push(element)
    return new ElementSource(asAudioContext(ctx), {
      id,
      url: `/beds/${id}.mp3`,
      createAudioElement: () => asMediaElement(element),
    })
  }
  return { ctx, dest, timers, track, source, elements }
}

const voiceOptions = (
  source: ElementSource,
  extra: Partial<Parameters<ElementTrack['play']>[1]> = {},
) => ({
  source,
  offsetSec: 1,
  durationSec: 6,
  fadeInSec: 2,
  fadeOutSec: 1,
  fadeCurve: 'linear' as FadeCurve,
  ...extra,
})

describe('ElementTrack linear voices', () => {
  it('builds node → gain → destination, records the ClipPlayer envelope plus a hard end, and plays from a timer', () => {
    const { ctx, dest, timers, track, source, elements } = setup()
    const bed = source('bed')
    const voice = track.play('k', voiceOptions(bed), 3)
    expect(voice).not.toBeNull()
    const gain = ctx.gains[1]
    const node = ctx.elementSources[0]
    expect(ctx.gains).toHaveLength(2)
    expect(node.connectCalls.calledWith(gain)).toBe(true)
    expect(gain.connectCalls.calledWith(dest)).toBe(true)
    expect(gain.gain.events).toEqual([
      { method: 'setValueAtTime', args: [fadeGain(0, 6, 2, 1), 3] },
      { method: 'linearRampToValueAtTime', args: [1, 5] },
      { method: 'setValueAtTime', args: [1, 8] },
      { method: 'linearRampToValueAtTime', args: [0, 9] },
      { method: 'setValueAtTime', args: [0, 9] },
    ])
    expect(voice?.startTime).toBe(3)
    expect(voice?.endTime).toBe(9)

    // Seeked at once, played only when the start comes.
    const element = elements[0]
    expect(element.seeks.calls).toEqual([[1]])
    expect(element.playCalls.count).toBe(0)
    expect(timers.pending).toBe(2)
    ctx.currentTime = 2.9
    timers.fireDue()
    expect(element.playCalls.count).toBe(0)
    ctx.currentTime = 3
    timers.fireDue()
    expect(element.playCalls.count).toBe(1)
    expect(element.seeks.count).toBe(1)
    expect(track.voices()).toHaveLength(1)

    // At the end the element pauses and the voice is forgotten.
    ctx.currentTime = 9
    timers.fireDue()
    expect(element.pauseCalls.count).toBe(1)
    expect(track.voices()).toHaveLength(0)
    expect(gain.disconnectCalls.count).toBe(1)
    expect(node.disconnectCalls.calledWith(gain)).toBe(true)
    expect(element.listenerCount('ended')).toBe(0)
    expect(timers.pending).toBe(0)
  })

  it('records the same envelope as an AudioTrack for the same clip (plus the hard end)', () => {
    const { ctx, track, source } = setup({ currentTime: 4.5 })
    const bufferCtx = createMockContext({ currentTime: 4.5, sampleRate: 48000 })
    const audio = new AudioTrack(asAudioContext(bufferCtx), {
      name: 'music',
      destination: bufferCtx.createGain() as unknown as AudioNode,
      samples: new SampleStore(asAudioContext(bufferCtx)),
      now: () => bufferCtx.currentTime,
    })
    const buffer = new MockAudioBuffer(2, 10 * 48000, 48000) as unknown as AudioBuffer
    for (const fadeCurve of ['linear', 'equalPower'] as const) {
      const clip = { offsetSec: 1, durationSec: 6, fadeInSec: 2, fadeOutSec: 1, fadeCurve }
      audio.play(fadeCurve, { buffer, ...clip }, 3)
      track.play(fadeCurve, { source: source(fadeCurve), ...clip }, 3)
    }
    const [linearBuffer, equalBuffer] = bufferCtx.gains.slice(1).map((g) => g.gain.events)
    const [linearElement, equalElement] = ctx.gains.slice(1).map((g) => g.gain.events)
    expect(linearElement.slice(0, -1)).toEqual(linearBuffer)
    expect(linearElement.at(-1)).toEqual({ method: 'setValueAtTime', args: [0, 9] })
    expect(equalElement.slice(0, -1)).toEqual(equalBuffer)
    expect(equalElement.at(-1)).toEqual({ method: 'setValueAtTime', args: [0, 10.5] })
  })

  it('joins a start that has passed partway in: seeks to offset + late and plays now', () => {
    const { ctx, timers, track, source, elements } = setup({ currentTime: 4.5 })
    const voice = track.play('k', voiceOptions(source('bed')), 3)
    expect(voice?.startTime).toBe(4.5)
    expect(voice?.endTime).toBe(9)
    expect(elements[0].seeks.calls).toEqual([[2.5]])
    expect(elements[0].playCalls.count).toBe(1)
    expect(ctx.gains[1].gain.events[0]).toEqual({
      method: 'setValueAtTime',
      args: [fadeGain(1.5, 6, 2, 1), 4.5],
    })
    expect(timers.pending).toBe(1)
  })

  it('returns null and creates nothing when the start is entirely in the past or empty', () => {
    const { ctx, track, source, elements } = setup({ currentTime: 20 })
    expect(track.play('k', voiceOptions(source('bed')), 3)).toBeNull()
    expect(track.play('z', voiceOptions(source('zero'), { durationSec: 0 }), 30)).toBeNull()
    expect(ctx.gains).toHaveLength(1)
    expect(elements[0].playCalls.count).toBe(0)
    expect(track.voices()).toHaveLength(0)
  })

  it('a late start timer re-seeks the element by the drift', () => {
    const { ctx, timers, track, source, elements } = setup()
    track.play('k', voiceOptions(source('bed')), 3)
    ctx.currentTime = 3 + ELEMENT_DRIFT_TOLERANCE_SECONDS + 0.2
    timers.fireDue()
    expect(elements[0].seeks.calls).toEqual([[1], [1 + ELEMENT_DRIFT_TOLERANCE_SECONDS + 0.2]])
    expect(elements[0].playCalls.count).toBe(1)

    const small = setup()
    small.track.play('k', voiceOptions(small.source('bed')), 3)
    small.ctx.currentTime = 3 + ELEMENT_DRIFT_TOLERANCE_SECONDS / 2
    small.timers.fireDue()
    expect(small.elements[0].seeks.calls).toEqual([[1]])
  })

  it('loop sets element.loop for the voice and clears it after', () => {
    const { ctx, timers, track, source, elements } = setup()
    track.play('k', voiceOptions(source('bed'), { loop: true }), 0)
    expect(elements[0].loop).toBe(true)
    ctx.currentTime = 6
    timers.fireDue()
    expect(elements[0].loop).toBe(false)
  })

  it('the media ending early forgets the voice', () => {
    const { timers, track, source, elements } = setup()
    track.play('k', voiceOptions(source('bed')), 0)
    elements[0].finish()
    expect(track.voices()).toHaveLength(0)
    expect(timers.pending).toBe(0)
  })
})

describe('ElementTrack equal-power voices', () => {
  const entry = (source: ElementSource, gainDb?: number) => ({
    source,
    offsetSec: 30,
    durationSec: 10,
    fadeInSec: CROSSFADE_SECONDS,
    fadeOutSec: CROSSFADE_SECONDS,
    fadeCurve: 'equalPower' as const,
    gainDb,
  })

  it('records the scheduleEntry events and seeks to the offset', () => {
    const { ctx, dest, track, source, elements } = setup()
    track.play('a', entry(source('bed')), 0)
    const gain = ctx.gains[1]
    expect(gain.gain.events.map((e) => e.method)).toEqual([
      'setValueAtTime',
      'setValueCurveAtTime',
      'setValueCurveAtTime',
      'setValueAtTime',
    ])
    const [fadeIn, fadeOut] = gain.gain.eventsFor('setValueCurveAtTime')
    expect(fadeIn.args[0]).toEqual(equalPowerFadeIn())
    expect(fadeIn.args.slice(1)).toEqual([0, CROSSFADE_SECONDS])
    expect(fadeOut.args[0]).toEqual(equalPowerFadeOut())
    expect(fadeOut.args.slice(1)).toEqual([10 - CROSSFADE_SECONDS, CROSSFADE_SECONDS])
    expect(gain.gain.eventsFor('setValueAtTime')).toEqual([
      { method: 'setValueAtTime', args: [0, 0] },
      { method: 'setValueAtTime', args: [0, 10] },
    ])
    expect(ctx.gains).toHaveLength(2)
    expect(gain.connectCalls.calledWith(dest)).toBe(true)
    expect(elements[0].seeks.calls).toEqual([[30]])
    expect(elements[0].playCalls.count).toBe(1)
  })

  it('a start that has passed plays from now but from the offset (Breathwork Live)', () => {
    const { track, source, elements } = setup({ currentTime: 2 })
    const voice = track.play('r', { ...entry(source('bed')), durationSec: 20 }, 1.5)
    expect(voice?.startTime).toBe(2)
    expect(voice?.endTime).toBe(22)
    expect(elements[0].seeks.calls).toEqual([[30]])
  })

  it('chains through a 10^(gainDb/20) trim node', () => {
    const { ctx, dest, track, source } = setup()
    track.play('a', entry(source('bed'), -6), 0)
    const fade = ctx.gains[1]
    const trim = ctx.gains[2]
    expect(trim.gain.value).toBeCloseTo(0.501, 3)
    expect(fade.connectCalls.calledWith(trim)).toBe(true)
    expect(trim.connectCalls.calledWith(dest)).toBe(true)
    track.stop('a')
    expect(trim.disconnectCalls.count).toBe(1)
  })
})

describe('ElementTrack voice control', () => {
  it('one playhead per source: a second start on the same source takes it over', () => {
    const { ctx, track, source, elements } = setup()
    const bed = source('bed')
    track.play('a', voiceOptions(bed), 0)
    track.play('b', voiceOptions(bed, { offsetSec: 100 }), 2)
    expect(track.voices().map((v) => v.key)).toEqual(['b'])
    expect(elements[0].pauseCalls.count).toBe(1)
    expect(ctx.gains[1].disconnectCalls.count).toBe(1)
    expect(elements[0].seeks.calls).toEqual([[1], [100]])
    // Two sources may sound together.
    track.play('c', voiceOptions(source('other')), 2)
    expect(track.voices().map((v) => v.key)).toEqual(['b', 'c'])
  })

  it('fadeOut on a sounding voice cancels, fades, hard-ends and retimes the pause; pending is silenced', () => {
    const { ctx, timers, track, source, elements } = setup()
    track.play('a', voiceOptions(source('a'), { fadeCurve: 'equalPower' }), 0)
    track.play('lin', voiceOptions(source('lin')), 0)
    track.play('pending', voiceOptions(source('p')), 7.5)
    ctx.currentTime = 2
    track.fadeOut('a', 2, CROSSFADE_SECONDS)
    track.fadeOut('lin', 2, 1)
    track.fadeOut('pending', 2, CROSSFADE_SECONDS)

    const gainA = ctx.gains[1]
    expect(gainA.gain.eventsFor('cancelScheduledValues')).toEqual([
      { method: 'cancelScheduledValues', args: [2] },
    ])
    const fade = gainA.gain.eventsFor('setValueCurveAtTime')[2]
    expect(fade.args[0]).toEqual(equalPowerFadeOut())
    expect(fade.args.slice(1)).toEqual([2, CROSSFADE_SECONDS])
    expect(gainA.gain.events.at(-1)).toEqual({
      method: 'setValueAtTime',
      args: [0, 2 + CROSSFADE_SECONDS],
    })
    expect(track.voice('a')?.endTime).toBe(2 + CROSSFADE_SECONDS)

    const gainLin = ctx.gains[2]
    expect(gainLin.gain.events.slice(-2)).toEqual([
      { method: 'linearRampToValueAtTime', args: [0, 3] },
      { method: 'setValueAtTime', args: [0, 3] },
    ])

    // Scheduled but not yet sounding: gone at once, never played.
    expect(track.voice('pending')).toBeUndefined()
    expect(elements[2].playCalls.count).toBe(0)

    ctx.currentTime = 3
    timers.fireDue()
    expect(elements[1].pauseCalls.count).toBe(1)
    expect(track.voice('lin')).toBeUndefined()
    expect(elements[0].pauseCalls.count).toBe(0)
    ctx.currentTime = 2 + CROSSFADE_SECONDS
    timers.fireDue()
    expect(elements[0].pauseCalls.count).toBe(1)
    expect(track.voices()).toHaveLength(0)
  })

  it('stop(key) silences at once; stop(key, at) and stopAll({ at }) retime the pause', () => {
    const { ctx, timers, track, source, elements } = setup()
    track.play('a', voiceOptions(source('a')), 0)
    track.play('b', voiceOptions(source('b')), 0)
    track.play('c', voiceOptions(source('c')), 0)
    track.stop('a')
    expect(elements[0].pauseCalls.count).toBe(1)
    expect(track.voice('a')).toBeUndefined()

    ctx.currentTime = 1
    track.stop('b', 1.5)
    expect(track.voice('b')?.endTime).toBe(1.5)
    track.stopAll({ at: 1.75 })
    expect(track.voice('b')?.endTime).toBe(1.5)
    expect(track.voice('c')?.endTime).toBe(1.75)
    expect(track.voices()).toHaveLength(2)
    ctx.currentTime = 1.5
    timers.fireDue()
    expect(elements[1].pauseCalls.count).toBe(1)
    expect(elements[2].pauseCalls.count).toBe(0)
    ctx.currentTime = 1.75
    timers.fireDue()
    expect(elements[2].pauseCalls.count).toBe(1)
    expect(track.voices()).toHaveLength(0)
    expect(timers.pending).toBe(0)
  })

  it('stopPending cancels only voices that have not started; stopAll() everything', () => {
    const { ctx, timers, track, source, elements } = setup()
    track.play('sounding', voiceOptions(source('s')), 0)
    track.play('pending', voiceOptions(source('p')), 2)
    ctx.currentTime = 1
    expect(track.stopPending()).toEqual(['pending'])
    expect(elements[1].playCalls.count).toBe(0)
    expect(track.voices().map((v) => v.key)).toEqual(['sounding'])
    ctx.currentTime = 2
    timers.fireDue()
    expect(elements[1].playCalls.count).toBe(0)
    track.stopAll()
    expect(elements[0].pauseCalls.count).toBe(1)
    expect(track.voices()).toHaveLength(0)
    expect(timers.pending).toBe(0)
  })

  it('removeSource silences its voices; dispose silences all and refuses new plays', () => {
    const { track, source, elements } = setup()
    const bed = source('bed')
    track.addSource(bed)
    track.play('a', voiceOptions(bed), 0)
    expect(track.sources()).toEqual([bed])
    expect(track.removeSource('bed')).toBe(true)
    expect(track.removeSource('bed')).toBe(false)
    expect(track.source('bed')).toBeUndefined()
    expect(elements[0].pauseCalls.count).toBe(1)
    track.play('b', voiceOptions(source('other')), 0)
    track.dispose()
    expect(elements[1].pauseCalls.count).toBe(1)
    expect(track.play('c', voiceOptions(source('third')), 0)).toBeNull()
  })

  it('unlockAll unlocks every registered source', async () => {
    const { track, source, elements } = setup()
    track.addSource(source('a'))
    track.addSource(source('b'))
    await track.unlockAll()
    expect(elements.map((e) => e.playCalls.count)).toEqual([1, 1])
    expect(elements.map((e) => e.pauseCalls.count)).toEqual([1, 1])
  })
})

describe('ElementTrack as Schedulables', () => {
  function clip(id: string, startSec: number, extra: Partial<Clip> = {}): Clip {
    return {
      id,
      sourceId: `s-${id}`,
      startSec,
      offsetSec: 5,
      durationSec: 4,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear',
      gainDb: 0,
      ...extra,
    }
  }

  function scheduled(options: { lookaheadSec?: number; preloadSec?: number; loop?: boolean } = {}) {
    const base = setup({
      lookaheadSec: options.lookaheadSec ?? 0.2,
      preloadSec: options.preloadSec,
    })
    const transport = new Transport({
      now: () => base.ctx.currentTime,
      loop: options.loop ? { enabled: true, lengthSec: 32 } : undefined,
    })
    const scheduler = new Scheduler({ transport, tickMs: 40 })
    base.track.attach(scheduler)
    return { ...base, transport, scheduler }
  }

  it('plays clips as they enter the lookahead window, keyed clipId:iteration:startSec', () => {
    const { ctx, timers, track, source, elements, transport, scheduler } = scheduled()
    track.addSource(source('s-a'))
    track.clips.add(clip('a', 1))
    transport.start()
    scheduler.tick()
    expect(ctx.gains).toHaveLength(1)
    ctx.currentTime = 0.85
    scheduler.tick()
    scheduler.tick()
    expect(ctx.gains).toHaveLength(2)
    expect(track.voice('a:0:1.000')).toBeDefined()
    expect(elements[0].seeks.calls).toEqual([[5]])
    ctx.currentTime = 1
    timers.fireDue()
    expect(elements[0].playCalls.count).toBe(1)
    scheduler.dispose()
  })

  it('primes the source inside the preload window, ahead of playback', () => {
    const { ctx, track, source, elements, transport, scheduler } = scheduled({
      lookaheadSec: 1,
      preloadSec: 10,
    })
    track.addSource(source('s-a'))
    track.clips.add(clip('a', 8))
    transport.start()
    scheduler.tick()
    expect(elements[0].seeks.calls).toEqual([[5]])
    expect(elements[0].loadCalls.count).toBe(1)
    expect(ctx.gains).toHaveLength(1)
    ctx.currentTime = 7.5
    scheduler.tick()
    expect(ctx.gains).toHaveLength(2)
    scheduler.dispose()
  })

  it('declines a clip with no source and picks it up once one is registered or resolved', () => {
    const { ctx, track, source, transport, scheduler } = scheduled()
    track.clips.add(clip('a', 0.1))
    track.clips.add(clip('b', 0.15))
    transport.start()
    scheduler.tick()
    expect(ctx.gains).toHaveLength(1)
    track.addSource(source('s-a'))
    scheduler.tick()
    expect(ctx.gains).toHaveLength(2)
    expect(track.voice('a:0:0.100')).toBeDefined()

    const resolving = scheduled()
    const created: string[] = []
    const resolver = new ElementTrack(asAudioContext(resolving.ctx), {
      name: 'resolving',
      destination: resolving.dest as unknown as AudioNode,
      now: () => resolving.ctx.currentTime,
      lookaheadSec: 1,
      resolveSource: (c) => {
        created.push(c.sourceId)
        return resolving.source(c.sourceId)
      },
      setTimeoutFn: resolving.timers.set,
      clearTimeoutFn: resolving.timers.clear,
      scheduler: resolving.scheduler,
    })
    resolver.clips.add(clip('x', 0.5))
    resolving.transport.start()
    resolving.scheduler.tick()
    resolving.scheduler.tick()
    expect(created).toEqual(['s-x'])
    expect(resolver.source('s-x')).toBeDefined()
    expect(resolver.voice('x:0:0.500')).toBeDefined()
    scheduler.dispose()
    resolving.scheduler.dispose()
  })

  it('edits re-derive the queue: a moved pending clip is cancelled and rescheduled', () => {
    const { ctx, track, source, elements, transport, scheduler } = scheduled({ lookaheadSec: 1 })
    track.addSource(source('s-a'))
    track.clips.add(clip('a', 0.5))
    transport.start()
    scheduler.tick()
    expect(track.voice('a:0:0.500')).toBeDefined()
    track.clips.update('a', { startSec: 0.8 })
    expect(track.voice('a:0:0.500')).toBeUndefined()
    expect(track.voice('a:0:0.800')).toBeDefined()
    expect(elements[0].pauseCalls.count).toBe(1)
    expect(ctx.gains).toHaveLength(3)
    scheduler.dispose()
  })

  it('transport stop with a fade retimes the pause; pause silences immediately', () => {
    const { ctx, timers, track, source, elements, transport, scheduler } = scheduled({
      lookaheadSec: 1,
    })
    track.addSource(source('s-a'))
    track.clips.add(clip('a', 0))
    transport.start()
    scheduler.tick()
    ctx.currentTime = 1
    transport.stop({ fadeSec: 0.75 })
    expect(track.voice('a:0:0.000')?.endTime).toBe(1.75)
    ctx.currentTime = 1.75
    timers.fireDue()
    expect(elements[0].pauseCalls.count).toBe(1)

    transport.start()
    scheduler.tick()
    expect(track.voices()).toHaveLength(1)
    transport.pause()
    expect(elements[0].pauseCalls.count).toBe(2)
    expect(track.voices()).toHaveLength(0)
    scheduler.dispose()
  })

  it('loop: the same clip plays once per pass under distinct keys, taking the element over', () => {
    const { ctx, timers, track, source, elements, transport, scheduler } = scheduled({
      lookaheadSec: 1,
      loop: true,
    })
    track.addSource(source('s-a'))
    track.clips.add(clip('a', 0.5, { durationSec: 32 }))
    transport.start()
    scheduler.tick()
    ctx.currentTime = 0.5
    timers.fireDue()
    expect(elements[0].playCalls.count).toBe(1)
    elements[0].advance(31.3)
    ctx.currentTime = 31.8
    scheduler.tick()
    expect(track.voice('a:0:0.500')).toBeUndefined()
    expect(track.voice('a:1:0.500')).toBeDefined()
    expect(elements[0].pauseCalls.count).toBe(1)
    expect(elements[0].seeks.calls).toEqual([[5], [5]])
    ctx.currentTime = 32.5
    timers.fireDue()
    expect(elements[0].playCalls.count).toBe(2)
    scheduler.dispose()
  })

  it('dispose detaches from the scheduler and silences voices', () => {
    const { ctx, track, source, transport, scheduler } = scheduled({ lookaheadSec: 1 })
    track.addSource(source('s-a'))
    track.clips.add(clip('a', 0))
    transport.start()
    scheduler.tick()
    track.dispose()
    expect(track.voices()).toHaveLength(0)
    track.clips.add(clip('b', 0.1))
    scheduler.tick()
    expect(ctx.gains).toHaveLength(2)
    scheduler.dispose()
  })
})
