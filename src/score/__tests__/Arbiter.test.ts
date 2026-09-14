import { describe, expect, it } from 'vitest'

import {
  DEFAULT_ARBITRATION_POLICY,
  WRITER_KINDS,
  decide,
  type WriterKind,
} from '../../core/params/arbitration'
import { MockAudioBuffer, asAudioContext, createMockContext, type MockGainNode } from '../../testing'
import { createEngine } from '../../core/Engine'
import { Arbiter, arbiterTargets, conflicts, paramTargetOf, type ArbiterEvent } from '../Arbiter'
import { loadScore } from '../loadScore'
import { type Author } from '../log'
import { type Operation } from '../operations'
import { findStripHost } from '../schema'
import { ScoreDocument } from '../ScoreDocument'
import { demoScore } from './fixtures'

const human: Author = { id: 'local', kind: 'human' }
const midi: Author = { id: 'midi', kind: 'controller' }
const coach: Author = { id: 'coach', kind: 'agent' }
const lane: Author = { id: 'lane', kind: 'automation' }
const rails: Author = { id: 'rails', kind: 'system' }
const AUTHORS: Record<WriterKind, Author> = {
  human,
  controller: midi,
  agent: coach,
  automation: lane,
  system: rails,
}

interface Rig {
  document: ScoreDocument
  arbiter: Arbiter
  clock: { ms: number }
  events: ArbiterEvent[]
  timers: (() => void)[]
  level: (owner?: string) => number
}

function rig(options: ConstructorParameters<typeof Arbiter>[1] = {}): Rig {
  const clock = { ms: 0 }
  const document = new ScoreDocument(demoScore(), { now: () => clock.ms })
  const timers: (() => void)[] = []
  const arbiter = new Arbiter(document, {
    now: () => clock.ms,
    setTimeoutFn: (callback) => {
      timers.push(callback)
      return timers.length
    },
    clearTimeoutFn: () => {},
    ...options,
  })
  const events: ArbiterEvent[] = []
  arbiter.onChange((event) => events.push(event))
  const level = (owner = 'kick'): number => findStripHost(document.score, owner)?.strip.level ?? NaN
  return { document, arbiter, clock, events, timers, level }
}

const kickLevel = (value: number): Operation => ({
  type: 'strip.set',
  owner: 'kick',
  param: 'level',
  value,
})

/** One sample write per target kind, all on the demo score. */
const TARGET_OPS: Record<string, (value: number) => Operation> = {
  'strip param': kickLevel,
  'device param': (value) => ({
    type: 'device.setParam',
    device: 'kick-filter',
    param: 'frequency',
    value: 1000 + value,
  }),
  send: (value) => ({ type: 'send.set', owner: 'kick', target: 'hall', level: value }),
  master: (value) => ({ type: 'strip.set', owner: 'master', param: 'level', value }),
  structure: (value) => ({ type: 'strip.rename', id: 'kick', name: `Kick ${value}` }),
}

describe('Arbiter: the matrix', () => {
  const outcomeOf = { apply: 'applied', defer: 'deferred', drop: 'dropped' } as const

  for (const [kind, opFor] of Object.entries(TARGET_OPS)) {
    for (const holderKind of WRITER_KINDS) {
      for (const writerKind of WRITER_KINDS) {
        it(`${kind}: ${writerKind} writing into a target held by ${holderKind}`, () => {
          const { arbiter } = rig()
          const holder = { ...AUTHORS[holderKind], id: `${holderKind}-holder` }
          const targets = arbiterTargets(opFor(0))
          // Human and controller hold by writing; the others hold only through a lock.
          if (DEFAULT_ARBITRATION_POLICY.holds[holderKind]) {
            expect(arbiter.apply(opFor(0.1), { author: holder }).outcome).toBe('applied')
          } else {
            for (const target of targets) arbiter.lock(target, { author: holder })
          }
          const expected = outcomeOf[decide(DEFAULT_ARBITRATION_POLICY, writerKind, holderKind)]
          const result = arbiter.apply(opFor(0.2), { author: AUTHORS[writerKind] })
          expect(result.outcome).toBe(expected)
          if (expected !== 'applied') expect(result.holder).toEqual(holder)
          if (expected === 'dropped')
            expect(result.reason).toBe(DEFAULT_ARBITRATION_POLICY.holds[holderKind] ? 'held' : 'locked')
        })
      }
    }
  }

  it('a free target takes any writer, and the same owner writes through its own hold', () => {
    for (const kind of WRITER_KINDS) {
      expect(rig().arbiter.apply(kickLevel(0.3), { author: AUTHORS[kind] }).outcome).toBe('applied')
    }
    const { arbiter, level } = rig()
    expect(arbiter.apply(kickLevel(0.4), { author: human }).outcome).toBe('applied')
    expect(arbiter.apply(kickLevel(0.5), { author: human }).outcome).toBe('applied')
    expect(level()).toBe(0.5)
  })
})

describe('Arbiter: touch holds with an injected clock', () => {
  it('a human write holds for holdMs; an agent write waits and lands when the hold lapses', () => {
    const { arbiter, clock, events, level, timers } = rig()
    expect(arbiter.apply(kickLevel(0.5), { author: human }).outcome).toBe('applied')
    expect(arbiter.stateOf({ kind: 'strip', owner: 'kick', param: 'level' }).hold?.untilMs).toBe(5000)
    expect(timers).toHaveLength(1)

    clock.ms = 1000
    const deferred = arbiter.apply(kickLevel(0.2), { author: coach, label: 'agent:set_music_volume#1' })
    expect(deferred).toMatchObject({ outcome: 'deferred', holder: human, ticket: 1 })
    expect(level()).toBe(0.5)
    expect(arbiter.pending()).toHaveLength(1)
    expect(arbiter.stateOf('strip:kick:level').pending).toHaveLength(1)

    clock.ms = 4999
    arbiter.tick()
    expect(level()).toBe(0.5)
    clock.ms = 5000
    arbiter.tick()
    expect(level()).toBe(0.2)
    expect(arbiter.pending()).toEqual([])
    expect(events.map((event) => event.type)).toEqual(['held', 'deferred', 'freed', 'landed'])
    const landed = events.find((event) => event.type === 'landed')
    expect(landed?.type === 'landed' && landed.entry.author).toEqual(coach)
    expect(landed?.type === 'landed' && landed.entry.label).toBe('agent:set_music_volume#1')
  })

  it('the timer fires the tick on its own', () => {
    const { arbiter, clock, level, timers } = rig()
    arbiter.apply(kickLevel(0.5), { author: human })
    arbiter.apply(kickLevel(0.2), { author: coach })
    clock.ms = 5000
    timers.pop()?.()
    expect(level()).toBe(0.2)
  })

  it('every human write refreshes the hold; touch and release bracket a drag', () => {
    const { arbiter, clock, level } = rig()
    const target = { kind: 'strip' as const, owner: 'kick', param: 'level' as const }
    arbiter.touch(target, human)
    expect(arbiter.stateOf(target).hold).toMatchObject({ touching: true, untilMs: Infinity })
    clock.ms = 60_000
    arbiter.tick()
    expect(arbiter.apply(kickLevel(0.2), { author: coach }).outcome).toBe('deferred')
    arbiter.apply(kickLevel(0.6), { author: human, gesture: 'drag' })
    expect(arbiter.stateOf(target).hold?.touching).toBe(true)
    arbiter.release(target, human)
    expect(arbiter.stateOf(target).hold?.untilMs).toBe(65_000)
    clock.ms = 64_000
    arbiter.apply(kickLevel(0.7), { author: human })
    expect(arbiter.stateOf(target).hold?.untilMs).toBe(69_000)
    clock.ms = 68_999
    arbiter.tick()
    expect(level()).toBe(0.7)
    // The coach's write, still fresh (< deferTtlMs), lands once the hand is gone.
    clock.ms = 69_000
    arbiter.tick()
    expect(level()).toBe(0.2)
    expect(arbiter.pending()).toEqual([])
  })

  it('the latest agent write per target supersedes the earlier one; stale ones drop at release', () => {
    const { arbiter, clock, events, level } = rig({ deferTtlMs: 2000 })
    arbiter.apply(kickLevel(0.5), { author: human })
    clock.ms = 100
    arbiter.apply(kickLevel(0.2), { author: coach })
    clock.ms = 200
    arbiter.apply(kickLevel(0.3), { author: coach })
    expect(arbiter.pending().map((pending) => pending.ticket)).toEqual([2])
    expect(events.filter((event) => event.type === 'dropped')).toMatchObject([
      { reason: 'superseded', ticket: 1 },
    ])
    clock.ms = 5000
    arbiter.tick()
    expect(level()).toBe(0.5)
    expect(events.filter((event) => event.type === 'dropped')).toMatchObject([
      { reason: 'superseded' },
      { reason: 'stale', ticket: 2 },
    ])
  })

  it('release() without a target lets go of everything the author has in hand; cancel retires a wait', () => {
    const { arbiter, clock } = rig()
    arbiter.touch('strip:kick:level', human)
    arbiter.touch('strip:pad:level', human)
    arbiter.touch('strip:voice:level', midi)
    clock.ms = 10
    arbiter.release(undefined, human)
    expect(arbiter.holds().map((hold) => [hold.target, hold.touching])).toEqual([
      ['strip:kick:level', false],
      ['strip:pad:level', false],
      ['strip:voice:level', true],
    ])
    const deferred = arbiter.apply(kickLevel(0.1), { author: coach })
    expect(arbiter.cancel(deferred.ticket ?? -1)).toBe(true)
    expect(arbiter.cancel(99)).toBe(false)
    expect(arbiter.pending()).toEqual([])
    arbiter.clearHold('strip:kick:level')
    expect(arbiter.stateOf('strip:kick:level').holder).toBeNull()
  })

  it('a controller takes a human hold over (same class, latest wins) and the UI sees it', () => {
    const { arbiter, events } = rig()
    arbiter.apply(kickLevel(0.5), { author: human })
    arbiter.apply(kickLevel(0.6), { author: midi })
    expect(arbiter.stateOf('strip:kick:level').holder).toEqual(midi)
    expect(events.map((event) => event.type)).toEqual(['held', 'freed', 'held'])
    expect(events[1]).toMatchObject({ type: 'freed', reason: 'taken', hold: { owner: human } })
  })
})

describe('Arbiter: rails and locks', () => {
  it('a system write lands through any hold without taking it', () => {
    const { arbiter, level } = rig()
    arbiter.apply(kickLevel(0.5), { author: human })
    expect(arbiter.apply(kickLevel(0.9), { author: rails }).outcome).toBe('applied')
    expect(level()).toBe(0.9)
    expect(arbiter.stateOf('strip:kick:level').holder).toEqual(human)
    expect(arbiter.apply(kickLevel(0.2), { author: coach }).outcome).toBe('deferred')
  })

  it('a system lock refuses the human and the lane, parks the agent, and lifts on expiry', () => {
    const { arbiter, clock, level } = rig()
    arbiter.lock('strip:kick:level', { author: rails, ttlMs: 1000, reason: 'fade-out' })
    expect(arbiter.apply(kickLevel(0.1), { author: human })).toMatchObject({
      outcome: 'dropped',
      reason: 'locked',
    })
    expect(arbiter.apply(kickLevel(0.1), { author: lane })).toMatchObject({ outcome: 'dropped' })
    expect(arbiter.apply(kickLevel(0.3), { author: coach }).outcome).toBe('deferred')
    expect(arbiter.locks()).toMatchObject([{ reason: 'fade-out', untilMs: 1000 }])
    clock.ms = 1000
    arbiter.tick()
    expect(level()).toBe(0.3)
    expect(arbiter.locks()).toEqual([])
  })

  it('unlock lands the waiting agent; a lock without ttl waits for it', () => {
    const { arbiter, clock, level } = rig()
    arbiter.lock('strip:kick:level', { author: human })
    arbiter.apply(kickLevel(0.3), { author: coach })
    clock.ms = 10_000
    arbiter.tick()
    expect(level()).toBe(0.8)
    expect(arbiter.locks()).toMatchObject([{ untilMs: Infinity }])
    arbiter.unlock('strip:kick:level')
    expect(level()).toBe(0.3)
  })
})

describe('Arbiter: target keys', () => {
  it('structural edits conflict with holds beneath them; a restore conflicts with everything', () => {
    const { arbiter } = rig()
    arbiter.apply(kickLevel(0.5), { author: human })
    expect(arbiter.apply({ type: 'strip.rename', id: 'kick', name: 'K' }, { author: coach }).outcome).toBe('deferred')
    expect(arbiter.apply({ type: 'strip.rename', id: 'pad', name: 'P' }, { author: coach }).outcome).toBe('applied')
    expect(arbiter.apply({ type: 'score.replace', score: demoScore() }, { author: coach }).outcome).toBe('deferred')
    expect(conflicts('strip:kick', 'strip:kick:level')).toBe(true)
    expect(conflicts('strip:kick', 'strip:kickdrum')).toBe(false)
    expect(paramTargetOf('strip:kick:level')).toEqual({ kind: 'strip', owner: 'kick', param: 'level' })
    expect(paramTargetOf('device:d:cutoff')).toEqual({ kind: 'device', device: 'd', param: 'cutoff' })
    expect(paramTargetOf('strip:kick:mute')).toBeNull()
    expect(paramTargetOf('clips:kick')).toBeNull()
  })

  it('keys every operation type; batches take the union', () => {
    const batch: Operation = {
      type: 'batch',
      ops: [kickLevel(0.1), { type: 'strip.mute', owner: 'kick', mute: true }, kickLevel(0.2)],
    }
    expect(arbiterTargets(batch)).toEqual(['strip:kick:level', 'strip:kick:mute'])
    expect(arbiterTargets({ type: 'device.setParams', device: 'd', params: { a: 1, b: null } })).toEqual([
      'device:d:a',
      'device:d:b',
    ])
    expect(arbiterTargets({ type: 'clip.move', track: 'kick', id: 'a1', startSec: 1 })).toEqual([
      'clips:kick:a1',
    ])
    expect(arbiterTargets({ type: 'clip.replaceFrom', track: 'kick', fromSec: 1, clips: [] })).toEqual([
      'clips:kick',
    ])
    expect(arbiterTargets({ type: 'tempo.set', segments: [] })).toEqual(['score'])
  })

  it('a deferred write that no longer applies is dropped as failed; a load cancels every wait', () => {
    const { arbiter, clock, events, document } = rig()
    arbiter.apply(kickLevel(0.5), { author: human })
    arbiter.apply({ type: 'clip.move', track: 'kick', id: 'a1', startSec: 3 }, { author: human })
    arbiter.apply({ type: 'clip.move', track: 'kick', id: 'a1', startSec: 9 }, { author: coach })
    document.apply({ type: 'clip.remove', track: 'kick', id: 'a1' }, { author: rails })
    clock.ms = 5000
    arbiter.tick()
    expect(events.filter((event) => event.type === 'dropped')).toMatchObject([{ reason: 'failed' }])
    arbiter.apply(kickLevel(0.4), { author: human })
    arbiter.apply(kickLevel(0.1), { author: coach })
    document.load(demoScore())
    expect(arbiter.pending()).toEqual([])
    expect(arbiter.holds()).toEqual([])
    expect(events.filter((event) => event.type === 'dropped').at(-1)).toMatchObject({
      reason: 'cancelled',
    })
  })
})

describe('Arbiter: undo across arbitration (AE7)', () => {
  it('the coach lowers the music, the listener drags the fader, the fader wins, undo restores the coach value', () => {
    const { arbiter, clock, level } = rig()
    arbiter.apply(kickLevel(0.3), { author: coach, label: 'coach lower' })
    clock.ms = 100
    arbiter.apply(kickLevel(0.9), { author: human, gesture: 'drag' })
    arbiter.apply(kickLevel(0.7), { author: human, gesture: 'drag' })
    arbiter.endGesture()
    clock.ms = 200
    // The coach's later write does not undo the hand.
    expect(arbiter.apply(kickLevel(0.25), { author: coach }).outcome).toBe('deferred')
    expect(level()).toBe(0.7)
    expect(arbiter.undo()?.op).toEqual(kickLevel(0.3))
    expect(level()).toBe(0.3)
    expect(arbiter.redo()?.op).toEqual(kickLevel(0.7))
    expect(level()).toBe(0.7)
  })
})

describe('Arbiter: automation lanes', () => {
  it('a hand overrides the lane writer, writes through to the graph, and the lane resumes after the hold', async () => {
    const ctx = createMockContext({ sampleRate: 48000 })
    const engine = createEngine({
      context: asAudioContext(ctx),
      setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
      clearIntervalFn: () => {},
    })
    const buffer = new MockAudioBuffer(2, 48000 * 10, 48000) as unknown as AudioBuffer
    await engine.samples.load('a', buffer)
    await engine.samples.load('b', buffer)
    const clock = { ms: 0 }
    const document = new ScoreDocument(demoScore(), { now: () => clock.ms })
    const renderer = loadScore(engine, document, { onError: () => {} })
    await renderer.whenIdle()
    const arbiter = new Arbiter(document, {
      now: () => clock.ms,
      renderer,
      setTimeoutFn: () => 0,
      clearTimeoutFn: () => {},
    })
    const events: ArbiterEvent[] = []
    arbiter.onChange((event) => events.push(event))
    const target = { kind: 'strip' as const, owner: 'pad', param: 'level' as const }
    const writer = renderer.writerFor(target)
    expect(writer).toBeDefined()
    expect(renderer.writerFor({ kind: 'strip', owner: 'kick', param: 'level' })).toBeUndefined()
    const fader = renderer.audioTrack('pad').strip.fader as unknown as MockGainNode
    const before = fader.gain.events.length

    arbiter.apply({ type: 'strip.set', owner: 'pad', param: 'level', value: 0.55 }, { author: human })
    await renderer.whenIdle()
    expect(writer?.isOverridden).toBe(true)
    expect(arbiter.stateOf(target).overridden).toBe(true)
    // The override holds the param, then the hand's value ramps in — the renderer alone would have skipped it.
    expect(fader.gain.events.length).toBeGreaterThan(before)
    expect(fader.gain.lastEvent('setTargetAtTime')?.args[0]).toBeCloseTo(0.55)
    expect(events.map((event) => event.type)).toEqual(['overridden', 'held'])

    // Automation writing through the document while the hand holds is dropped.
    expect(
      arbiter.apply({ type: 'strip.set', owner: 'pad', param: 'level', value: 0.1 }, { author: lane })
        .outcome,
    ).toBe('dropped')

    clock.ms = 5000
    arbiter.tick()
    expect(writer?.isOverridden).toBe(false)
    expect(events.map((event) => event.type)).toEqual([
      'overridden',
      'held',
      'dropped',
      'freed',
      'resumed',
    ])
    expect(renderer.deviceIdFor(renderer.device('kick-filter'))).toBe('kick-filter')
    expect(renderer.writeThrough({ kind: 'device', device: 'nope', param: 'x' }, 1)).toBe(false)
    arbiter.dispose()
    engine.dispose()
  })

  it("with automationResume 'manual' the lane waits for releaseAutomation", async () => {
    const ctx = createMockContext({ sampleRate: 48000 })
    const engine = createEngine({
      context: asAudioContext(ctx),
      setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
      clearIntervalFn: () => {},
    })
    const buffer = new MockAudioBuffer(2, 48000 * 10, 48000) as unknown as AudioBuffer
    await engine.samples.load('a', buffer)
    await engine.samples.load('b', buffer)
    const clock = { ms: 0 }
    const document = new ScoreDocument(demoScore(), { now: () => clock.ms })
    const renderer = loadScore(engine, document, { onError: () => {} })
    await renderer.whenIdle()
    const arbiter = new Arbiter(document, {
      now: () => clock.ms,
      renderer,
      automationResume: 'manual',
      setTimeoutFn: () => 0,
      clearTimeoutFn: () => {},
    })
    const target = { kind: 'strip' as const, owner: 'pad', param: 'level' as const }
    arbiter.touch(target, human)
    expect(renderer.writerFor(target)?.isOverridden).toBe(true)
    arbiter.release(target, human)
    clock.ms = 10_000
    arbiter.tick()
    expect(renderer.writerFor(target)?.isOverridden).toBe(true)
    arbiter.releaseAutomation()
    expect(renderer.writerFor(target)?.isOverridden).toBe(false)
    engine.dispose()
  })
})
