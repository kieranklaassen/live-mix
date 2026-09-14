// Parity of the port against the code it replaces: ambient-live's anchor and
// window functions (verbatim in ./fixtures) over randomised inputs, and
// Breathwork Live's MusicEngine handoff rule driven through the Scheduler.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MockAudioContext, advance, configureMocks } from '../../../testing'
import { positionFromAnchor, scheduleKey, wrapPosition } from '../anchor'
import { Scheduler, type Schedulable } from '../Scheduler'
import { Transport } from '../Transport'
import { startsInWindow } from '../window'
import * as original from './fixtures/ambient-live-originals'

/** mulberry32: a small seeded PRNG so a failing case is reproducible. */
function prng(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const LOOP_LENGTH_SEC = original.LOOP_LENGTH_SEC
const CASES = 2000

describe('positionFromAnchor matches ambient-live', () => {
  it('agrees on position, pass and finished for both loop settings', () => {
    const random = prng(4)
    for (let i = 0; i < CASES; i += 1) {
      const anchor = {
        contextTime: random() * 10_000,
        positionSec: random() * LOOP_LENGTH_SEC,
        iteration: Math.floor(random() * 50),
      }
      const contextTime = anchor.contextTime + random() * 3 * LOOP_LENGTH_SEC
      for (const enabled of [true, false]) {
        const expected = original.positionFromAnchor(
          { ...anchor, playheadSec: anchor.positionSec },
          contextTime,
          enabled,
        )
        const actual = positionFromAnchor(anchor, contextTime, {
          enabled,
          lengthSec: LOOP_LENGTH_SEC,
        })
        expect(actual.positionSec).toBe(expected.playheadSec)
        expect(actual.iteration).toBe(expected.iteration)
        expect(actual.finished).toBe(expected.finished)
      }
    }
  })
})

describe('startsInWindow matches ambient-live clipsInWindow', () => {
  it('returns the same starts in the same order without catch-up', () => {
    const random = prng(7)
    for (let i = 0; i < CASES; i += 1) {
      const clips = Array.from({ length: Math.floor(random() * 8) }, (_, index) => ({
        id: `clip-${index}`,
        // Some beyond the loop end, as a timeline may hold them.
        startSec: random() * (LOOP_LENGTH_SEC + 4),
      }))
      const playheadSec = random() * LOOP_LENGTH_SEC
      const lookaheadSec = random() * 6 - 0.5
      const iteration = Math.floor(random() * 20)
      const enabled = random() < 0.5
      const expected = original.clipsInWindow({
        clips,
        playheadSec,
        lookaheadSec,
        iteration,
        loopEnabled: enabled,
      })
      const actual = startsInWindow({
        clips,
        positionSec: playheadSec,
        lookaheadSec,
        iteration,
        loop: { enabled, lengthSec: LOOP_LENGTH_SEC },
      })
      expect(actual.map((hit) => [hit.clipId, hit.iteration])).toEqual(
        expected.map((hit) => [hit.clipId, hit.iteration]),
      )
      actual.forEach((hit, index) => {
        expect(hit.startsInSec).toBeCloseTo(expected[index].startsInSec, 9)
      })
    }
  })

  it('passes the original test vectors verbatim', () => {
    const clips = [
      { id: 'a', startSec: 0.5 },
      { id: 'b', startSec: 4 },
      { id: 'c', startSec: LOOP_LENGTH_SEC - 0.5 },
    ]
    const cases = [
      { playheadSec: 0.45, lookaheadSec: 0.2 },
      { playheadSec: 0, lookaheadSec: 0.2 },
      { playheadSec: 0.6, lookaheadSec: 0.2 },
      { playheadSec: 0.5, lookaheadSec: 0.2 },
      { playheadSec: 0.4, lookaheadSec: 0.1 },
      { playheadSec: 0.5, lookaheadSec: 0.1 },
      { playheadSec: LOOP_LENGTH_SEC - 0.1, lookaheadSec: 0.7 },
    ]
    for (const { playheadSec, lookaheadSec } of cases) {
      for (const loopEnabled of [true, false]) {
        expect(
          startsInWindow({
            clips,
            positionSec: playheadSec,
            lookaheadSec,
            iteration: 0,
            loop: { enabled: loopEnabled, lengthSec: LOOP_LENGTH_SEC },
          }),
        ).toEqual(
          original.clipsInWindow({ clips, playheadSec, lookaheadSec, iteration: 0, loopEnabled }),
        )
      }
    }
  })
})

describe('anchor helpers match ambient-live', () => {
  it('scheduleKey produces the same strings', () => {
    const random = prng(11)
    for (let i = 0; i < CASES; i += 1) {
      const start = {
        clipId: `clip-${Math.floor(random() * 100)}`,
        iteration: Math.floor(random() * 100),
        startSec: random() * LOOP_LENGTH_SEC,
      }
      expect(scheduleKey(start)).toBe(original.scheduleKey(start))
    }
  })

  it('wrapPosition is clampTime, and advancePlayhead composed', () => {
    const random = prng(13)
    for (let i = 0; i < CASES; i += 1) {
      const sec = random() * 200 - 100
      const length = random() < 0.1 ? 0 : random() * 64
      expect(wrapPosition(sec, length)).toBe(original.clampTime(sec, length))
      const delta = random() * 4
      expect(wrapPosition(sec + delta, LOOP_LENGTH_SEC)).toBe(original.advancePlayhead(sec, delta))
    }
  })
})

describe('Scheduler matches the Breathwork Live MusicEngine handoff', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    configureMocks({ advanceTimers: vi.advanceTimersByTimeAsync })
  })

  afterEach(() => {
    configureMocks({})
    vi.useRealTimers()
  })

  it('hands each track over once, at its planned start, within the same 5 s lookahead', async () => {
    // The harness's two-section selection: a 10 s, b 8 s, c 12 s, 2.5 s crossfades,
    // so tracks begin at 0, 7.5 and 15.5 seconds into the session.
    const startAts = { a: 0, b: 7.5, c: 15.5 }
    const ctx = new MockAudioContext()
    const transport = new Transport({ now: () => ctx.currentTime })
    const scheduler = new Scheduler({ transport, tickMs: original.SCHEDULER_TICK_MS })

    const handed = new Map<string, { when: number; at: number }>()
    const playlist: Schedulable = {
      lookaheadSec: original.SCHEDULE_LOOKAHEAD_SECONDS,
      clips: () => Object.entries(startAts).map(([id, startSec]) => ({ id, startSec })),
      schedule(start, when) {
        expect(handed.has(start.clipId)).toBe(false)
        handed.set(start.clipId, { when, at: ctx.currentTime })
        return true
      },
      cancel: () => {},
      cancelPending: () => [],
      cancelAll: () => {},
    }
    scheduler.register(playlist)

    // The reference model runs on its own interval at the same cadence, as
    // `MusicEngine.start()` does (`setIntervalFn(() => this.tick(), SCHEDULER_TICK_MS)`).
    const reference = Object.entries(startAts).map(([id, startAt]) => ({
      id,
      startAt,
      scheduled: false,
    }))
    const referenceHanded = new Map<string, number>()
    const referenceTick = () => {
      for (const id of original.musicEngineTick(reference, ctx.currentTime)) {
        referenceHanded.set(id, ctx.currentTime)
      }
    }

    transport.start()
    referenceTick()
    const referenceTimer = setInterval(referenceTick, original.SCHEDULER_TICK_MS)
    await advance(ctx, 20)
    clearInterval(referenceTimer)

    expect([...handed.keys()].sort()).toEqual(['a', 'b', 'c'])
    for (const [id, startAt] of Object.entries(startAts)) {
      const mine = handed.get(id)
      const theirs = referenceHanded.get(id)
      expect(mine).toBeDefined()
      expect(theirs).toBeDefined()
      if (!mine || theirs === undefined) continue
      // Same `source.start(startAt)` in the graph.
      expect(mine.when).toBe(startAt)
      // Handed over inside the lookahead, on the same tick or the one after
      // (the window is half-open where the engine's `<=` is closed).
      expect(startAt - mine.at).toBeLessThanOrEqual(original.SCHEDULE_LOOKAHEAD_SECONDS + 1e-9)
      expect(Math.abs(mine.at - theirs)).toBeLessThanOrEqual(
        original.SCHEDULER_TICK_MS / 1000 + 1e-9,
      )
    }
    expect(handed.get('a')?.at).toBe(0)
    expect(referenceHanded.get('a')).toBe(0)
  })
})
