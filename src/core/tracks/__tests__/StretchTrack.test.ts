import { describe, expect, it } from 'vitest'

import {
  MockAudioBuffer,
  MockAudioNode,
  asAudioContext,
  createMockContext,
  type MockAudioContext,
} from '../../../testing'
import { type Clip } from '../../clips/Clip'
import { equalPowerFadeOut } from '../../clips/curves'
import {
  type StretchNode,
  type StretchNodeFactory,
  type StretchScheduleChange,
} from '../../sources/StretchSource'
import { TempoMap } from '../../time/TempoMap'
import { Scheduler } from '../../transport/Scheduler'
import { Transport } from '../../transport/Transport'
import { SampleStore } from '../SampleStore'
import {
  DEFAULT_STRETCH_PRELOAD_SECONDS,
  StretchTrack,
  entryOffset,
  segmentsFrom,
  warpClipSecAt,
  wrapIntoLoop,
} from '../StretchTrack'

class FakeStretchNode extends MockAudioNode {
  readonly scheduled: StretchScheduleChange[] = []
  readonly buffers: Float32Array[][] = []
  dropped = 0
  inputTime = 0

  constructor() {
    super('stretch')
  }

  schedule(change: StretchScheduleChange): void {
    this.scheduled.push(change)
  }

  start(): void {}

  stop(when?: number): void {
    this.schedule({ output: when, active: false })
  }

  addBuffers(buffers: readonly Float32Array[]): Promise<number> {
    this.buffers.push([...buffers])
    return Promise.resolve(buffers[0].length / 48000)
  }

  dropBuffers(): Promise<unknown> {
    this.dropped += 1
    return Promise.resolve(undefined)
  }

  latency(): number {
    return 0.1
  }
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

function buffer(ctx: MockAudioContext, seconds: number): AudioBuffer {
  return new MockAudioBuffer(2, seconds * ctx.sampleRate, ctx.sampleRate) as unknown as AudioBuffer
}

function setup(options: { lookaheadSec?: number; preloadSec?: number; tempo?: TempoMap } = {}) {
  const ctx = createMockContext({ sampleRate: 48000 })
  const nodes: FakeStretchNode[] = []
  const createStretch: StretchNodeFactory = () => {
    const node = new FakeStretchNode()
    nodes.push(node)
    return Promise.resolve(node as unknown as StretchNode)
  }
  const samples = new SampleStore(asAudioContext(ctx))
  const dest = ctx.createGain()
  const timers: { fn: () => void; at: number }[] = []
  let tempo = options.tempo ?? new TempoMap()
  const track = new StretchTrack(asAudioContext(ctx), {
    name: 'warped',
    destination: dest as unknown as AudioNode,
    samples,
    now: () => ctx.currentTime,
    tempo: () => tempo,
    createStretch,
    lookaheadSec: options.lookaheadSec ?? 0.2,
    preloadSec: options.preloadSec,
    setTimeoutFn: (fn, ms) => {
      timers.push({ fn, at: ctx.currentTime + ms / 1000 })
      return timers.length as unknown as ReturnType<typeof setTimeout>
    },
    clearTimeoutFn: (id) => {
      const index = (id as unknown as number) - 1
      if (timers[index]) timers[index] = { fn: () => {}, at: Infinity }
    },
  })
  const transport = new Transport({ now: () => ctx.currentTime })
  const scheduler = new Scheduler({ transport, tickMs: 40 })
  track.attach(scheduler)
  const fireDue = () => {
    for (const timer of timers) {
      if (timer.at <= ctx.currentTime) {
        timer.at = Infinity
        timer.fn()
      }
    }
  }
  return {
    ctx,
    nodes,
    samples,
    dest,
    track,
    transport,
    scheduler,
    fireDue,
    setTempo: (next: TempoMap) => {
      tempo = next
    },
  }
}

describe('StretchTrack scheduling', () => {
  it('builds the stretch source ahead, declines the start until it is ready, then plays it', async () => {
    const { ctx, nodes, samples, track, transport, scheduler } = setup()
    await samples.load('s-a', buffer(ctx, 10))
    track.clips.add(clip('a', 1))
    expect(track.preloadSec).toBe(DEFAULT_STRETCH_PRELOAD_SECONDS)

    transport.start(0)
    scheduler.tick() // preload window reaches the clip: the node is built asynchronously
    expect(track.pendingCount).toBe(1)
    expect(track.voices()).toHaveLength(0)
    await track.settled()
    expect(track.pendingCount).toBe(0)
    expect(nodes).toHaveLength(1)
    expect(nodes[0].buffers[0]).toHaveLength(2)

    ctx.currentTime = 0.9 // inside the 0.2 s lookahead of the 1 s start
    scheduler.tick()
    const [voice] = track.voices()
    expect(voice.key).toBe('a:0:1.000')
    expect(voice.startTime).toBe(1)
    expect(voice.endTime).toBe(5)
    expect(nodes[0].scheduled).toEqual([
      { output: 1, active: true, semitones: 0, input: 0, rate: 1 },
      { output: 5, active: false },
    ])
    // Gain → strip; the fade gain sits at unity for a clip without fades.
    expect(ctx.gains.at(-1)?.gain.events).toEqual([{ method: 'setValueAtTime', args: [1, 1] }])
    expect(nodes[0].connectCalls.calls[0]?.[0]).toBe(ctx.gains.at(-1))
  })

  it('plays warp markers on the tempo map, semitones and the loop region', async () => {
    const { ctx, nodes, samples, track, transport, scheduler } = setup({
      tempo: new TempoMap([{ atSec: 0, bpm: 120 }]),
    })
    await samples.load('s-w', buffer(ctx, 8))
    // 8 beats of source (one beat = 0.5 s at 120) spread over 4 source seconds → rate 1, then a
    // double-speed second half (2 source s over 1 timeline s).
    track.clips.add(
      clip('w', 0, {
        durationSec: 3,
        offsetSec: 1,
        semitones: -2,
        loop: true,
        loopStartSec: 1,
        loopEndSec: 5,
        warp: [
          { sourceSec: 1, beat: 0 },
          { sourceSec: 3, beat: 4 },
          { sourceSec: 5, beat: 6 },
        ],
      }),
    )
    transport.start(0)
    scheduler.tick()
    await track.settled()
    scheduler.tick()
    expect(nodes[0].scheduled).toEqual([
      { output: 0, active: true, semitones: -2, loopStart: 1, loopEnd: 5, input: 1, rate: 1 },
      { output: 2, input: 3, rate: 2 },
      { output: 3, input: 5, rate: 2 },
      { output: 3, active: false },
    ])
  })

  it('joins late along the warp and wrapped into the loop region', () => {
    const segments = [
      { atSec: 0, sourceSec: 1, rate: 1 },
      { atSec: 2, sourceSec: 3, rate: 2 },
    ]
    expect(segmentsFrom(segments, 0.5)).toEqual([
      { atSec: 0, sourceSec: 1.5, rate: 1 },
      { atSec: 1.5, sourceSec: 3, rate: 2 },
    ])
    expect(segmentsFrom(segments, 2.5)).toEqual([{ atSec: 0, sourceSec: 4, rate: 2 }])
    expect(segmentsFrom([], 1)).toEqual([])

    expect(entryOffset(1, 0.5, undefined)).toBe(1.5)
    expect(entryOffset(1, 2, { startSec: 1, endSec: 5 })).toBe(3)
    expect(entryOffset(1, 5, { startSec: 1, endSec: 5 })).toBe(2) // 6 wraps into [1, 5)
    expect(entryOffset(4, 3, { startSec: 1, endSec: 5 })).toBe(3) // 7 → 1 + (6 % 4)
    expect(entryOffset(1, 9, { startSec: 5, endSec: 5 })).toBe(10) // degenerate region: no wrap
  })

  it('a late start joins mid-clip: position advances, fades follow the clip timeline', async () => {
    const { ctx, nodes, samples, track, transport, scheduler } = setup()
    await samples.load('s-a', buffer(ctx, 10))
    track.clips.add(
      clip('a', 1, { fadeInSec: 1, fadeOutSec: 1, loop: true, loopStartSec: 0, loopEndSec: 2 }),
    )
    transport.start(0)
    scheduler.tick()
    await track.settled()
    ctx.currentTime = 3.5 // the timer stalled: the 1 s start is 2.5 s behind
    scheduler.tick()
    const [voice] = track.voices()
    expect(voice.startTime).toBe(3.5)
    expect(voice.endTime).toBe(5)
    // Entering 2.5 s into a 2 s loop region wraps to 0.5 s in.
    expect(nodes[0].scheduled[0]).toMatchObject({
      output: 3.5,
      input: 0.5,
      loopStart: 0,
      loopEnd: 2,
    })
    expect(nodes[0].scheduled.at(-1)).toEqual({ output: 5, active: false })
    const events = (voice.gain as unknown as { gain: { events: unknown[] } }).gain.events
    expect(events[0]).toEqual({ method: 'setValueAtTime', args: [1, 3.5] }) // past the fade-in
    expect(events.slice(-2)).toEqual([
      { method: 'setValueAtTime', args: [1, 4] }, // fade-out starts on the clip's own timeline
      { method: 'linearRampToValueAtTime', args: [0, 5] },
    ])
  })

  it('fadeOutVoice anchors, ramps out and stops the source; equal-power uses the curve', async () => {
    const { ctx, nodes, samples, track, transport, scheduler } = setup()
    await samples.load('s-a', buffer(ctx, 10))
    await samples.load('s-e', buffer(ctx, 10))
    track.clips.add(clip('a', 0))
    track.clips.add(
      clip('e', 0, { fadeCurve: 'equalPower', fadeInSec: 0.5, fadeOutSec: 0.5, gainDb: -6 }),
    )
    transport.start(0)
    scheduler.tick()
    await track.settled()
    scheduler.tick()
    expect(track.voices()).toHaveLength(2)
    ctx.currentTime = 1
    const aGain = (
      track.voice('a:0:0.000')?.gain as unknown as { gain: { value: number; events: unknown[] } }
    ).gain
    aGain.value = 0.9
    track.fadeOutVoice('a:0:0.000', 1, 0.5)
    expect(aGain.events.slice(-3)).toEqual([
      { method: 'cancelScheduledValues', args: [1] },
      { method: 'setValueAtTime', args: [0.9, 1] },
      { method: 'linearRampToValueAtTime', args: [0, 1.5] },
    ])
    const aNode = nodes.find((node) =>
      node.scheduled.some((c) => c.output === 4 && c.active === false),
    )
    expect(aNode?.scheduled.at(-1)).toEqual({ output: 1.5, active: false })
    expect(track.voice('a:0:0.000')?.endTime).toBe(1.5)

    track.fadeOutVoice('e:0:0.000', 1, 0.25)
    const eGain = ctx.gains.find((gain) => gain.gain.eventsFor('setValueCurveAtTime').length > 0)
    const curve = eGain?.gain.eventsFor('setValueCurveAtTime').at(-1)
    expect(curve?.args[0]).toEqual(equalPowerFadeOut())
    expect(curve?.args.slice(1)).toEqual([1, 0.25])
    // The −6 dB trim sits between the fade gain and the strip.
    const trim = ctx.gains.find((gain) => Math.abs(gain.gain.value - 0.501) < 0.001)
    expect(trim).toBeDefined()
  })

  it('stopPending silences unstarted voices; stopAll stops at a time; the end timer releases nodes', async () => {
    const { ctx, nodes, samples, track, transport, scheduler, fireDue } = setup({ lookaheadSec: 2 })
    await samples.load('s-a', buffer(ctx, 10))
    await samples.load('s-b', buffer(ctx, 10))
    track.clips.add(clip('a', 0, { durationSec: 1 }))
    track.clips.add(clip('b', 1.5))
    transport.start(0)
    scheduler.tick()
    await track.settled()
    scheduler.tick()
    expect(track.voices().map((voice) => voice.key)).toEqual(['a:0:0.000', 'b:0:1.500'])

    ctx.currentTime = 0.5
    expect(track.stopPending()).toEqual(['b:0:1.500'])
    expect(track.voices().map((voice) => voice.key)).toEqual(['a:0:0.000'])
    expect(nodes.filter((node) => node.dropped === 1)).toHaveLength(1)

    const aNode = track.voice('a:0:0.000')?.source.node as unknown as FakeStretchNode
    track.stopAll({ at: 0.75 })
    expect(aNode.scheduled.at(-1)).toEqual({ output: 0.75, active: false })
    expect(track.voice('a:0:0.000')?.endTime).toBe(0.75)
    ctx.currentTime = 1
    fireDue() // 0.75 + 0.1 s latency has passed
    expect(track.voices()).toHaveLength(0)
    expect(aNode.dropped).toBe(1)

    track.dispose()
    expect(track.voices()).toHaveLength(0)
  })

  it('a warped clip enters at its offsetSec (legato carries a position) and wraps into the loop region', async () => {
    const { ctx, nodes, samples, track, transport, scheduler } = setup()
    await samples.load('s-w', buffer(ctx, 8))
    // Source 1 → 3 over beats 0 → 4 (2 s at 120: rate 1), then 3 → 5 over beats 4 → 6 (1 s: rate 2).
    track.clips.add(
      clip('w', 0, {
        durationSec: 3,
        offsetSec: 2, // a legato launch carried the position 1 s into the first segment
        loop: true,
        loopStartSec: 1,
        loopEndSec: 5,
        warp: [
          { sourceSec: 1, beat: 0 },
          { sourceSec: 3, beat: 4 },
          { sourceSec: 5, beat: 6 },
        ],
      }),
    )
    transport.start(0)
    scheduler.tick()
    await track.settled()
    scheduler.tick()
    // Entry at clip second 1 (source 2), the rate-2 segment 1 s later, end after 3 s.
    expect(nodes[0].scheduled).toEqual([
      { output: 0, active: true, semitones: 0, loopStart: 1, loopEnd: 5, input: 2, rate: 1 },
      { output: 1, input: 3, rate: 2 },
      { output: 2, input: 5, rate: 2 },
      { output: 3, active: false },
    ])

    const segments = [
      { atSec: 0, sourceSec: 1, rate: 1 },
      { atSec: 2, sourceSec: 3, rate: 2 },
    ]
    expect(warpClipSecAt(segments, 1)).toBe(0)
    expect(warpClipSecAt(segments, 0.5)).toBe(0) // before the first marker: the clip start
    expect(warpClipSecAt(segments, 2)).toBe(1)
    expect(warpClipSecAt(segments, 3.5)).toBe(2.25)
    expect(warpClipSecAt([], 4)).toBe(4)
    expect(wrapIntoLoop(3.5, { startSec: 1, endSec: 3 })).toBe(1.5)
    expect(wrapIntoLoop(2.5, { startSec: 1, endSec: 3 })).toBe(2.5)
    expect(wrapIntoLoop(9, undefined)).toBe(9)
  })

  it('the preload keeps offering a start until its node is built, so a late decode still builds ahead', async () => {
    const { ctx, samples, track, transport, scheduler } = setup({
      lookaheadSec: 0.2,
      preloadSec: 10,
    })
    const loads: string[] = []
    const lazy = new StretchTrack(asAudioContext(ctx), {
      name: 'lazy',
      destination: ctx.createGain() as unknown as AudioNode,
      samples,
      now: () => ctx.currentTime,
      tempo: () => new TempoMap(),
      createStretch: () => Promise.resolve(new FakeStretchNode() as unknown as StretchNode),
      lookaheadSec: 0.2,
      preloadSec: 10,
      resolveSource: (c) => {
        loads.push(c.sourceId)
        return buffer(ctx, 4)
      },
    })
    track.detach()
    lazy.attach(scheduler)
    lazy.clips.add(clip('far', 5))
    transport.start(0)
    scheduler.tick() // preload window (10 s) reaches the clip; the sample is not decoded yet
    expect(loads).toEqual(['s-far'])
    expect(lazy.pendingCount).toBe(0)
    await samples.settled()
    scheduler.tick() // still 5 s ahead of playback: the node is built now, not at the 0.2 s lookahead
    expect(lazy.pendingCount).toBe(1)
    await lazy.settled()
    scheduler.tick()
    expect(lazy.voices()).toHaveLength(0) // nothing plays yet: the start is 5 s away
    ctx.currentTime = 4.9
    scheduler.tick()
    expect(lazy.voices().map((voice) => voice.startTime)).toEqual([5])
    lazy.dispose()
  })

  it('a clip whose sample is not loaded asks for it and keeps being offered', async () => {
    const { ctx, samples, track, transport, scheduler } = setup()
    const loads: string[] = []
    const withResolve = new StretchTrack(asAudioContext(ctx), {
      name: 'r',
      destination: ctx.createGain() as unknown as AudioNode,
      samples,
      now: () => ctx.currentTime,
      tempo: () => new TempoMap(),
      createStretch: () => Promise.reject(new Error('no worklet')),
      resolveSource: (c) => {
        loads.push(c.sourceId)
        return buffer(ctx, 4)
      },
    })
    withResolve.attach(scheduler)
    withResolve.clips.add(clip('x', 0))
    track.detach()
    transport.start(0)
    scheduler.tick()
    expect(loads).toEqual(['s-x'])
    await samples.settled()
    scheduler.tick()
    await withResolve.settled() // the node build fails: nothing plays, nothing throws
    expect(withResolve.pendingCount).toBe(0)
    scheduler.tick() // the start is offered again and another build is attempted
    expect(withResolve.pendingCount).toBe(1)
    await withResolve.settled()
    expect(withResolve.voices()).toHaveLength(0)
    withResolve.dispose()
  })
})
