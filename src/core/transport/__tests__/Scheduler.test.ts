import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type ClipWindow } from '../../clips/window'
import { MockAudioContext, advance, configureMocks } from '../../../testing'
import { scheduleKey, type ScheduledStart, type TransportLoop } from '../anchor'
import { DEFAULT_TICK_MS, REJOIN_FADE_SECONDS, Scheduler, type Schedulable } from '../Scheduler'
import { Transport } from '../Transport'

type Handoff = { key: string; start: ScheduledStart; when: number; at: number; joining?: boolean }

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

describe('Scheduler first window after a pin', () => {
  // The audio clock is the audio thread's: it can move on between the
  // transport's pin and the scheduler's first pass, in the same task. Here a
  // listener ahead of the scheduler stands in for that.
  function buildWithDrift(
    items: ClipWindow['clips'],
    { driftSec = 128 / 44_100, loop = LOOP }: { driftSec?: number; loop?: TransportLoop } = {},
  ) {
    const ctx = new MockAudioContext()
    ctx.currentTime = 100
    const transport = new Transport({ now: () => ctx.currentTime, loop })
    transport.onChange((change) => {
      if (change.reason === 'start' || change.reason === 'seek') ctx.currentTime += driftSec
    })
    const scheduler = new Scheduler({ transport })
    const track = new FakeTrack(ctx, 0.2, items)
    scheduler.register(track)
    return { ctx, transport, scheduler, track }
  }

  it('hands over a clip that starts exactly where the transport is started', () => {
    const { ctx, transport, scheduler, track } = buildWithDrift([{ id: 'top', startSec: 0 }])
    transport.start()
    expect(track.keys()).toEqual(['top:0:0.000'])
    // Its time is the anchor's, already a render quantum behind: the track joins it late.
    expect(track.handed[0].when).toBe(100)
    expect(track.handed[0].at).toBeGreaterThan(100)

    ctx.currentTime += 0.04
    scheduler.tick()
    expect(track.handed).toHaveLength(1)
  })

  it('does so from a position the transport was left at, and after any number of pins', () => {
    const { ctx, transport, track } = buildWithDrift([
      { id: 'before', startSec: 3.999 },
      { id: 'here', startSec: 4 },
    ])
    for (let pin = 0; pin < 500; pin += 1) {
      transport.seek(4)
      transport.start()
      ctx.currentTime += 0.37
      transport.pause()
    }
    // Every start from 4 handed the clip at 4 over, in that pass, and never the one just before it.
    expect(track.keys()).toEqual(Array.from({ length: 500 }, (_, pin) => `here:${pin}:4.000`))
  })

  it('does so when a seek lands on a clip while playing', () => {
    const { ctx, transport, track } = buildWithDrift([{ id: 'here', startSec: 12.5 }])
    transport.start()
    ctx.currentTime += 1
    transport.seek(12.5)
    expect(track.keys()).toEqual(['here:1:12.500'])
    expect(track.handed[0].when).toBe(transport.anchor?.contextTime)
  })

  it('reaches across the loop end when the clock ran that far', () => {
    const { transport, track } = buildWithDrift(
      [
        { id: 'end', startSec: 3.95 },
        { id: 'top', startSec: 0 },
      ],
      { driftSec: 0.1, loop: { enabled: true, lengthSec: 4 } },
    )
    transport.seek(3.95)
    transport.start()
    expect(track.keys()).toEqual(['end:0:3.950', 'top:1:0.000'])
    expect(track.handed.map((entry) => round(entry.when))).toEqual([100.1, 100.15])
  })

  it('leaves a schedulable registered mid-play to start from where the transport is', () => {
    const { ctx, transport, scheduler } = buildWithDrift([])
    transport.start()
    ctx.currentTime += 4
    const late = new FakeTrack(ctx, 0.2, [
      { id: 'gone', startSec: 0 },
      { id: 'next', startSec: 4.1 },
    ])
    scheduler.register(late)
    expect(late.keys()).toEqual(['next:0:4.100'])
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

describe('Scheduler joins clips the position is inside', () => {
  /** A track that can enter a clip partway, like an AudioTrack: it is told when it is asked to. */
  class JoiningTrack extends FakeTrack {
    readonly joinsLate = true
    readonly faded: [string, number | undefined][] = []

    override schedule(start: ScheduledStart, when: number, joining?: boolean): boolean {
      if (!super.schedule(start, when)) return false
      this.handed[this.handed.length - 1].joining = joining === true
      return true
    }

    override cancel(key: string, fadeSec?: number): void {
      super.cancel(key)
      this.faded.push([key, fadeSec])
    }

    joined(): string[] {
      return this.handed.filter((entry) => entry.joining).map((entry) => entry.key)
    }
  }

  const strokes = [
    { id: 'pad', startSec: 2, durationSec: 16 },
    { id: 'hit', startSec: 6, durationSec: 0.5 },
    { id: 'tail', startSec: 20, durationSec: 4 },
  ]

  function buildJoining(items: ClipWindow['clips'] = strokes, loop: TransportLoop = LOOP) {
    const ctx = new MockAudioContext()
    ctx.currentTime = 100
    const transport = new Transport({ now: () => ctx.currentTime, loop })
    const scheduler = new Scheduler({ transport })
    const track = new JoiningTrack(ctx, 0.2, items)
    scheduler.register(track)
    return { ctx, transport, scheduler, track }
  }

  it('hands over a clip the transport is started inside, with the clock time its start had', () => {
    const { transport, track } = buildJoining()
    transport.seek(6.25)
    transport.start()
    // The pad began 4.25 s ago and the hit a quarter of a second ago; the tail is still ahead.
    expect(track.joined()).toEqual(['pad:0:2.000', 'hit:0:6.000'])
    expect(track.handed.map((entry) => round(entry.when))).toEqual([95.75, 99.75])
  })

  it('does the same where a seek lands while playing, under the new pass', () => {
    const { ctx, transport, track } = buildJoining()
    transport.start()
    ctx.currentTime = 101
    transport.seek(21)
    expect(track.cancelAllCalls).toEqual([0])
    expect(track.joined()).toEqual(['tail:1:20.000'])
    expect(round(track.handed[0].when)).toBe(100)
  })

  it('does not join a clip that starts exactly there, or one that ends exactly there', () => {
    const { transport, track } = buildJoining()
    transport.seek(6.5)
    transport.start()
    // The hit ends at 6.5 and is over; only the pad is entered partway.
    expect(track.joined()).toEqual(['pad:0:2.000'])
    transport.seek(20)
    expect(track.joined()).toEqual(['pad:0:2.000'])
    expect(track.keys()).toEqual(['pad:0:2.000', 'tail:1:20.000'])
  })

  it('joins once: later ticks and the timer leave what it joined alone', async () => {
    const { ctx, transport, scheduler, track } = buildJoining()
    transport.seek(10)
    transport.start()
    scheduler.tick()
    await advance(ctx, 1)
    expect(track.keys()).toEqual(['pad:0:2.000'])
  })

  it('leaves a schedulable that cannot join, and a clip with no length, to wait for their starts', () => {
    const { ctx, transport, scheduler, track } = buildJoining([{ id: 'bare', startSec: 2 }])
    const plain = new FakeTrack(ctx, 0.2, strokes)
    scheduler.register(plain)
    transport.seek(10)
    transport.start()
    expect(track.handed).toEqual([])
    expect(plain.handed).toEqual([])
  })

  it('offers a declined start again once it has passed, as a join, until its clip is over', () => {
    const { ctx, transport, scheduler, track } = buildJoining([
      { id: 'short', startSec: 0.1, durationSec: 1 },
      { id: 'long', startSec: 0.1, durationSec: 8 },
    ])
    track.accept = false
    transport.start()
    ctx.currentTime = 101.5
    scheduler.tick()
    expect(track.handed).toEqual([])

    // Decoded at last: the short one is over, the long one comes in where it has got to.
    track.accept = true
    ctx.currentTime = 102
    scheduler.tick()
    expect(track.joined()).toEqual(['long:0:0.100'])
    expect(round(track.handed[0].when)).toBe(100.1)
    scheduler.tick()
    expect(track.handed).toHaveLength(1)
  })

  it('does not join a declined start whose clip has moved or gone', () => {
    const { ctx, transport, scheduler, track } = buildJoining([
      { id: 'moved', startSec: 0.1, durationSec: 8 },
      { id: 'gone', startSec: 0.1, durationSec: 8 },
    ])
    track.accept = false
    transport.start()
    track.accept = true
    ctx.currentTime = 101
    track.items = [{ id: 'moved', startSec: 5, durationSec: 8 }]
    scheduler.refresh()
    expect(track.handed).toEqual([])
  })

  it('joins a clip declined at the start of the transport once it can be taken', () => {
    const { ctx, transport, scheduler, track } = buildJoining()
    track.accept = false
    transport.seek(10)
    transport.start()
    track.accept = true
    ctx.currentTime = 100.3
    scheduler.tick()
    expect(track.joined()).toEqual(['pad:0:2.000'])
    expect(round(track.handed[0].when)).toBe(92)
  })

  describe('rejoin', () => {
    it('enters a clip moved or dropped under the playhead, in the same turn', () => {
      const { ctx, transport, scheduler, track } = buildJoining()
      transport.start()
      ctx.currentTime = 101
      scheduler.tick()
      // Nothing sounds at 1 s. The tail is dragged back over the playhead and a new clip dropped there.
      track.items = [
        strokes[0],
        strokes[1],
        { id: 'tail', startSec: 0.5, durationSec: 4 },
        { id: 'new', startSec: 0, durationSec: 2 },
      ]
      scheduler.refresh()
      expect(track.handed).toEqual([])
      scheduler.rejoin(['tail', 'new'])
      expect(track.joined()).toEqual(['new:0:0.000', 'tail:0:0.500'])
      expect(track.handed.map((entry) => round(entry.when))).toEqual([100, 100.5])
    })

    it('lets a sounding clip go with a short fade and enters it again as it now is', () => {
      const { ctx, transport, scheduler, track } = buildJoining()
      transport.seek(1.9)
      transport.start()
      ctx.currentTime = 103
      scheduler.tick()
      expect(track.keys()).toEqual(['pad:0:2.000'])

      // Its fades changed: same place, so the same key, played afresh from where the transport is.
      scheduler.rejoin(['pad'])
      expect(track.faded).toEqual([['pad:0:2.000', REJOIN_FADE_SECONDS]])
      expect(track.keys()).toEqual(['pad:0:2.000', 'pad:0:2.000'])
      expect(track.handed[1].joining).toBe(true)
      expect(round(track.handed[1].when)).toBe(100.1)
    })

    it('lets a clip sounding across a loop change go rather than doubling it', () => {
      const { ctx, transport, scheduler, track } = buildJoining()
      transport.seek(10)
      transport.start()
      expect(track.keys()).toEqual(['pad:0:2.000'])

      // The re-pin numbers a fresh pass; the pad is still sounding under the old one.
      ctx.currentTime = 101
      transport.setLoop({ enabled: false })
      scheduler.rejoin(['pad'])
      expect(track.faded).toEqual([['pad:0:2.000', REJOIN_FADE_SECONDS]])
      expect(track.keys()).toEqual(['pad:0:2.000', 'pad:1:2.000'])
    })

    it('leaves clips it was not given alone, and a named clip the position is outside', () => {
      const { ctx, transport, scheduler, track } = buildJoining()
      transport.seek(10)
      transport.start()
      ctx.currentTime = 101
      scheduler.rejoin(['tail', 'hit'])
      expect(track.cancelled).toEqual([])
      expect(track.keys()).toEqual(['pad:0:2.000'])
    })

    it('re-derives a pending start of a named clip inside the window', () => {
      const { ctx, transport, scheduler, track } = buildJoining()
      transport.seek(19.9)
      transport.start()
      expect(track.keys()).toEqual(['tail:0:20.000'])
      ctx.currentTime = 100.05
      scheduler.rejoin(['tail'])
      expect(track.cancelled).toEqual(['tail:0:20.000'])
      expect(track.keys()).toEqual(['tail:0:20.000', 'tail:0:20.000'])
      expect(track.handed[1].joining).toBe(false)
      expect(round(track.handed[1].when)).toBe(100.1)
    })

    it('leaves a clip the schedulable keeps exactly as it sounds', () => {
      const { ctx, transport, scheduler, track } = buildJoining()
      transport.seek(1.9)
      transport.start()
      ctx.currentTime = 103
      scheduler.tick()
      // The pad's voice could not be entered again at once if it were let go.
      const kept = Object.assign(track, { keeps: (key: string): boolean => key === 'pad:0:2.000' })
      const handed = kept.handed.length
      kept.items = [{ id: 'pad', startSec: 2, durationSec: 12 }, strokes[1], strokes[2]]
      scheduler.rejoin(['pad'])
      expect(kept.cancelled).toEqual([])
      expect(kept.faded).toEqual([])
      expect(kept.handed).toHaveLength(handed)
      // Once it no longer holds on to it, the same call lets it go and enters it again.
      kept.keeps = () => false
      scheduler.rejoin(['pad'])
      expect(kept.faded).toEqual([['pad:0:2.000', REJOIN_FADE_SECONDS]])
      expect(kept.joined()).toEqual(['pad:0:2.000'])
    })

    it('does nothing while not playing, or for a schedulable that cannot join', () => {
      const { ctx, transport, scheduler, track } = buildJoining()
      scheduler.rejoin(['pad'])
      const plain = new FakeTrack(ctx, 0.2, strokes)
      scheduler.register(plain)
      transport.seek(1.9)
      transport.start()
      ctx.currentTime = 103
      scheduler.tick()
      scheduler.rejoin(['pad'])
      expect(plain.cancelled).toEqual([])
      expect(plain.keys()).toEqual(['pad:0:2.000'])
      expect(track.handed).toHaveLength(2)
    })
  })

  describe('refresh', () => {
    it('fades a sounding clip that was cut short of where the transport is', () => {
      const { ctx, transport, scheduler, track } = buildJoining()
      transport.seek(10)
      transport.start()
      ctx.currentTime = 101
      track.items = [{ id: 'pad', startSec: 2, durationSec: 8.5 }, strokes[1], strokes[2]]
      scheduler.refresh()
      expect(track.faded).toEqual([['pad:0:2.000', REJOIN_FADE_SECONDS]])

      // Drawn out again past the playhead: it waits for `rejoin`, or for its start.
      track.items = strokes
      scheduler.refresh()
      expect(track.keys()).toEqual(['pad:0:2.000'])
    })

    it('keeps a sounding clip that still reaches the transport, through a loop change too', () => {
      const { ctx, transport, scheduler, track } = buildJoining()
      transport.seek(10)
      transport.start()
      ctx.currentTime = 101
      track.items = [{ id: 'pad', startSec: 2, durationSec: 12 }, strokes[1], strokes[2]]
      scheduler.refresh()
      transport.setLoop({ enabled: false })
      scheduler.refresh()
      expect(track.cancelled).toEqual([])
    })
  })
})
