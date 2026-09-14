import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type ClipWindow } from '../../clips/window'
import { MockAudioContext, advance, configureMocks } from '../../../testing'
import { scheduleKey, type ScheduledStart, type TransportLoop } from '../anchor'
import { DEFAULT_TICK_MS, Scheduler, type Schedulable } from '../Scheduler'
import { Transport } from '../Transport'

type Handoff = { key: string; start: ScheduledStart; when: number; at: number }

/** Rounds away float noise from `anchor + offset` sums so lists compare with `toEqual`. */
const round = (sec: number) => Math.round(sec * 1e6) / 1e6

/** A schedulable that records what it is told, like ambient-live's ClipPlayer would. */
class FakeTrack implements Schedulable {
  readonly handed: Handoff[] = []
  /** Starts currently scheduled in the "graph", by key, with their audio-clock time. */
  readonly voices = new Map<string, number>()
  readonly cancelled: string[] = []
  readonly cancelAllCalls: number[] = []
  accept = true

  constructor(
    private readonly ctx: MockAudioContext,
    readonly lookaheadSec: number,
    public items: ClipWindow['clips'],
  ) {}

  clips() {
    return this.items
  }

  schedule(start: ScheduledStart, when: number): boolean {
    if (!this.accept) return false
    const key = scheduleKey(start)
    this.handed.push({ key, start, when, at: this.ctx.currentTime })
    this.voices.set(key, when)
    return true
  }

  cancel(key: string): void {
    this.voices.delete(key)
    this.cancelled.push(key)
  }

  cancelPending(): string[] {
    const pending = [...this.voices]
      .filter(([, when]) => when > this.ctx.currentTime)
      .map(([key]) => key)
    for (const key of pending) this.voices.delete(key)
    return pending
  }

  cancelAll(fadeSec: number): void {
    this.voices.clear()
    this.cancelAllCalls.push(fadeSec)
  }

  keys(): string[] {
    return this.handed.map((entry) => entry.key)
  }
}

const LOOP: TransportLoop = { enabled: true, lengthSec: 32 }
const clips = [
  { id: 'a', startSec: 0.5 },
  { id: 'b', startSec: 4 },
  { id: 'c', startSec: 31.5 },
]

function build({
  loop = LOOP,
  lookaheadSec = 0.2,
  tickMs,
  items = clips,
  startAt = 100,
}: {
  loop?: TransportLoop
  lookaheadSec?: number
  tickMs?: number
  items?: ClipWindow['clips']
  startAt?: number
} = {}) {
  const ctx = new MockAudioContext()
  ctx.currentTime = startAt
  const transport = new Transport({ now: () => ctx.currentTime, loop })
  const scheduler = new Scheduler({ transport, tickMs })
  const track = new FakeTrack(ctx, lookaheadSec, items)
  scheduler.register(track)
  return { ctx, transport, scheduler, track }
}

beforeEach(() => {
  vi.useFakeTimers()
  configureMocks({ advanceTimers: vi.advanceTimersByTimeAsync })
})

afterEach(() => {
  configureMocks({})
  vi.useRealTimers()
})

describe('Scheduler window handoff', () => {
  it('hands each start over once, at its audio-clock time, as the window reaches it', async () => {
    const { ctx, transport, track } = build()
    transport.start()
    expect(track.handed).toEqual([])

    await advance(ctx, 0.4)
    expect(track.keys()).toEqual(['a:0:0.500'])
    expect(track.handed[0].when).toBe(100.5)
    expect(track.handed[0].at).toBeLessThan(100.5)
    expect(track.handed[0].at).toBeGreaterThanOrEqual(100.5 - 0.2 - 0.05)

    await advance(ctx, 3.6)
    expect(track.keys()).toEqual(['a:0:0.500', 'b:0:4.000'])
    expect(track.handed[1].when).toBe(104)
  })

  it('wraps into the next pass with its own key and clock time', async () => {
    const { ctx, transport, track } = build()
    transport.seek(31.4)
    transport.start()
    await advance(ctx, 1)
    expect(track.keys()).toEqual(['c:0:31.500', 'a:1:0.500'])
    expect(track.handed[0].when).toBeCloseTo(100.1, 9)
    expect(track.handed[1].when).toBeCloseTo(100 + 32 - 31.4 + 0.5, 9)
  })

  it('does not hand a start over twice however often it ticks', () => {
    const { ctx, transport, scheduler, track } = build({ lookaheadSec: 5 })
    transport.start()
    for (let i = 0; i < 10; i += 1) {
      ctx.currentTime += 0.01
      scheduler.tick()
    }
    expect(track.keys()).toEqual(['a:0:0.500', 'b:0:4.000'])
  })

  it('offers a declined start again on the next tick', () => {
    const { transport, scheduler, track } = build({ lookaheadSec: 5 })
    track.accept = false
    transport.start()
    scheduler.tick()
    expect(track.handed).toEqual([])
    track.accept = true
    scheduler.tick()
    expect(track.keys()).toEqual(['a:0:0.500', 'b:0:4.000'])
    scheduler.tick()
    expect(track.handed).toHaveLength(2)
  })

  it('gives every schedulable its own lookahead', () => {
    const { ctx, transport, scheduler, track: near } = build({ lookaheadSec: 0.2 })
    const far = new FakeTrack(ctx, 5, clips)
    scheduler.register(far)
    transport.start()
    expect(near.keys()).toEqual([])
    expect(far.keys()).toEqual(['a:0:0.500', 'b:0:4.000'])
    ctx.currentTime = 100.35
    scheduler.tick()
    expect(near.keys()).toEqual(['a:0:0.500'])
    expect(far.handed).toHaveLength(2)
  })

  it('schedules a schedulable registered mid-play straight away', () => {
    const { ctx, transport, scheduler } = build()
    transport.start()
    ctx.currentTime = 100.4
    const late = new FakeTrack(ctx, 0.2, clips)
    scheduler.register(late)
    expect(late.keys()).toEqual(['a:0:0.500'])
  })

  it('leaves a schedulable alone once unregistered', async () => {
    const { ctx, transport, scheduler, track } = build()
    const off = scheduler.register(track)
    transport.start()
    off()
    await advance(ctx, 5)
    expect(track.handed).toEqual([])
  })
})

describe('Scheduler edits (refresh)', () => {
  it('re-derives a pending start that moved and keeps the same clock time for one that did not', () => {
    const { transport, scheduler, track } = build({ lookaheadSec: 5 })
    transport.start()
    expect(track.keys()).toEqual(['a:0:0.500', 'b:0:4.000'])

    track.items = [
      { id: 'a', startSec: 2 },
      { id: 'b', startSec: 4 },
      { id: 'c', startSec: 31.5 },
    ]
    scheduler.refresh()
    expect([...track.voices]).toEqual([
      ['a:0:2.000', 102],
      ['b:0:4.000', 104],
    ])
    expect(track.cancelled).toEqual([])
  })

  it('silences a sounding start that moved and schedules its new position', () => {
    const { ctx, transport, scheduler, track } = build({ lookaheadSec: 5 })
    transport.start()
    ctx.currentTime = 101
    track.items = [{ id: 'a', startSec: 3 }, ...clips.slice(1)]
    scheduler.refresh()
    expect(track.cancelled).toEqual(['a:0:0.500'])
    expect(track.voices.get('a:0:3.000')).toBe(103)
    expect(track.voices.has('a:0:0.500')).toBe(false)
  })

  it('leaves a sounding start alone when another clip is edited', () => {
    const { ctx, transport, scheduler, track } = build({ lookaheadSec: 5 })
    transport.start()
    ctx.currentTime = 101
    track.items = [clips[0], { id: 'b', startSec: 4.5 }, clips[2]]
    scheduler.refresh()
    expect(track.cancelled).toEqual([])
    expect(track.voices.get('a:0:0.500')).toBe(100.5)
    expect(track.voices.get('b:0:4.500')).toBe(104.5)
    expect(track.voices.has('b:0:4.000')).toBe(false)
  })

  it('silences a removed clip', () => {
    const { ctx, transport, scheduler, track } = build({ lookaheadSec: 5 })
    transport.start()
    ctx.currentTime = 101
    track.items = clips.slice(1)
    scheduler.refresh()
    expect(track.cancelled).toEqual(['a:0:0.500'])
    expect([...track.voices.keys()]).toEqual(['b:0:4.000'])
  })

  it('picks up a clip dropped inside the window in the same turn', () => {
    const { ctx, transport, scheduler, track } = build()
    transport.start()
    ctx.currentTime = 100.4
    scheduler.tick()
    track.items = [...clips, { id: 'd', startSec: 0.45 }]
    scheduler.refresh()
    // The pending `a` is re-derived too, at the same clock time — as ambient-live's edit effect does.
    expect(track.keys()).toEqual(['a:0:0.500', 'd:0:0.450', 'a:0:0.500'])
    expect(track.handed[1].when).toBeCloseTo(100.45, 9)
    expect([...track.voices]).toEqual([
      ['d:0:0.450', track.handed[1].when],
      ['a:0:0.500', 100.5],
    ])
  })

  it('does nothing while not playing', () => {
    const { scheduler, track } = build({ lookaheadSec: 5 })
    scheduler.refresh()
    expect(track.handed).toEqual([])
  })
})

describe('Scheduler catch-up after a throttled timer (AE4)', () => {
  it('hands over every start that fell due during the gap once, late, and never again', async () => {
    const items = [
      { id: 'p', startSec: 1 },
      { id: 'q', startSec: 2 },
      { id: 'r', startSec: 3 },
      { id: 's', startSec: 3.5 },
      { id: 't', startSec: 4.1 },
    ]
    const { ctx, transport, scheduler, track } = build({ items })
    transport.start()
    expect(track.handed).toEqual([])

    // The tab is backgrounded: the audio clock runs for 4 s, the timer does not fire.
    ctx.currentTime += 4
    scheduler.tick()
    expect(track.keys()).toEqual(['p:0:1.000', 'q:0:2.000', 'r:0:3.000', 's:0:3.500', 't:0:4.100'])
    expect(track.handed.map((entry) => round(entry.when))).toEqual([101, 102, 103, 103.5, 104.1])
    for (const entry of track.handed.slice(0, 4)) expect(entry.when).toBeLessThan(entry.at)

    await advance(ctx, 1)
    scheduler.tick()
    expect(track.handed).toHaveLength(5)
  })

  it('catches up across a loop seam and keeps the pass numbers straight', () => {
    const items = [
      { id: 'x', startSec: 0.5 },
      { id: 'y', startSec: 3.5 },
    ]
    const { ctx, transport, scheduler, track } = build({
      items,
      loop: { enabled: true, lengthSec: 4 },
    })
    transport.start()
    ctx.currentTime += 6
    scheduler.tick()
    expect(track.keys()).toEqual(['x:0:0.500', 'y:0:3.500', 'x:1:0.500'])
    expect(track.handed.map((entry) => entry.when)).toEqual([100.5, 103.5, 104.5])

    ctx.currentTime += 1.4
    scheduler.tick()
    expect(track.keys().slice(3)).toEqual(['y:1:3.500'])
    expect(track.handed[3].when).toBe(107.5)
  })

  it('does not reach back across a re-pin', () => {
    const { ctx, transport, scheduler, track } = build({ lookaheadSec: 0.2 })
    transport.start()
    ctx.currentTime += 4
    transport.seek(10)
    scheduler.tick()
    expect(track.handed).toEqual([])
  })
})

describe('Scheduler follows the transport', () => {
  it('silences everything on pause and stops scheduling', async () => {
    const { ctx, transport, track } = build({ lookaheadSec: 5 })
    transport.start()
    expect(track.voices.size).toBe(2)
    transport.pause()
    expect(track.cancelAllCalls).toEqual([0])
    expect(track.voices.size).toBe(0)
    await advance(ctx, 10)
    expect(track.handed).toHaveLength(2)
  })

  it('passes the stop fade on', () => {
    const { transport, track } = build({ lookaheadSec: 5 })
    transport.start()
    transport.stop({ fadeSec: 0.75 })
    expect(track.cancelAllCalls).toEqual([0.75])
  })

  it('re-derives from the new position on seek', () => {
    const { transport, track } = build({ lookaheadSec: 5 })
    transport.start()
    transport.seek(30)
    expect(track.cancelAllCalls).toEqual([0])
    expect(track.keys().slice(2)).toEqual(['c:1:31.500', 'a:2:0.500'])
    expect(track.handed[2].when).toBe(101.5)
    expect(track.handed[3].when).toBe(102.5)
  })

  it('resumes from where it paused with fresh pass numbers', () => {
    const { ctx, transport, track } = build({ lookaheadSec: 5 })
    transport.start()
    ctx.currentTime = 102
    transport.pause()
    ctx.currentTime = 200
    transport.start()
    expect(track.keys().slice(2)).toEqual(['b:1:4.000'])
    expect(track.handed[2].when).toBe(202)
  })

  it('pauses the transport at the end of a loop-off timeline and silences it', async () => {
    const { ctx, transport, track } = build({
      loop: { enabled: false, lengthSec: 2 },
      items: [{ id: 'a', startSec: 0.5 }],
    })
    transport.start()
    await advance(ctx, 2.2)
    expect(transport.state).toBe('paused')
    expect(transport.position().positionSec).toBe(2)
    expect(track.cancelAllCalls).toEqual([0])
    expect(track.keys()).toEqual(['a:0:0.500'])
  })

  it('re-derives pending starts under new pass numbers when the loop changes, leaving sounding ones alone', () => {
    const { ctx, transport, track } = build({
      loop: { enabled: false, lengthSec: Infinity },
      lookaheadSec: 5,
    })
    transport.start()
    expect(track.keys()).toEqual(['a:0:0.500', 'b:0:4.000'])
    ctx.currentTime = 101
    transport.setLoop({ enabled: true, lengthSec: 8 })
    expect(transport.anchor).toEqual({ contextTime: 101, positionSec: 1, iteration: 1 })
    expect(track.cancelled).toEqual([])
    expect([...track.voices]).toEqual([
      ['a:0:0.500', 100.5],
      ['b:1:4.000', 104],
    ])
  })
})

describe('Scheduler timer', () => {
  it('ticks on an interval of tickMs, 40 ms by default', () => {
    const { ctx, transport, scheduler, track } = build()
    expect(scheduler.tickMs).toBe(DEFAULT_TICK_MS)
    transport.start()
    ctx.currentTime = 100.4
    vi.advanceTimersByTime(39)
    expect(track.handed).toEqual([])
    vi.advanceTimersByTime(1)
    expect(track.keys()).toEqual(['a:0:0.500'])
  })

  it('honours a custom tick', () => {
    const { ctx, transport, track } = build({ tickMs: 100 })
    transport.start()
    ctx.currentTime = 100.4
    vi.advanceTimersByTime(99)
    expect(track.handed).toEqual([])
    vi.advanceTimersByTime(1)
    expect(track.handed).toHaveLength(1)
  })

  it('attaches to a transport that is already playing', () => {
    const ctx = new MockAudioContext()
    const transport = new Transport({ now: () => ctx.currentTime, loop: LOOP })
    transport.start()
    ctx.currentTime = 0.4
    const scheduler = new Scheduler({ transport })
    const track = new FakeTrack(ctx, 0.2, clips)
    scheduler.register(track)
    expect(track.keys()).toEqual(['a:0:0.500'])
    ctx.currentTime = 3.9
    vi.advanceTimersByTime(40)
    expect(track.keys()).toEqual(['a:0:0.500', 'b:0:4.000'])
  })

  it('stops ticking and listening once disposed', async () => {
    const { ctx, transport, scheduler, track } = build()
    transport.start()
    scheduler.dispose()
    await advance(ctx, 5)
    transport.pause()
    expect(track.handed).toEqual([])
    expect(track.cancelAllCalls).toEqual([])
    expect(vi.getTimerCount()).toBe(0)
  })
})
