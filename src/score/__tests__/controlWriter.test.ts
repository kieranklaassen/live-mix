import { describe, expect, it } from 'vitest'

import {
  MockAudioBuffer,
  asAudioContext,
  createMockContext,
  type MockGainNode,
} from '../../testing'
import { ControlSurface, type ControlWrite } from '../../core/control/ControlSurface'
import { absoluteEvent } from '../../core/control/event'
import { type ControlSource } from '../../core/control/source'
import { createEngine } from '../../core/Engine'
import { Arbiter, type ArbiterResult } from '../Arbiter'
import { arbitratedControlWriter, controlWriteToOperation } from '../controlWriter'
import { loadScore } from '../loadScore'
import { type Author } from '../log'
import { findStripHost } from '../schema'
import { ScoreDocument } from '../ScoreDocument'
import { demoScore } from './fixtures'

const human: Author = { id: 'local', kind: 'human' }
const cc7: ControlSource = { kind: 'cc', channel: 1, controller: 7 }
const cc10: ControlSource = { kind: 'cc', channel: 1, controller: 10 }

async function rig() {
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
  const results: [ControlWrite, ArbiterResult][] = []
  const surface = new ControlSurface({
    engine,
    write: arbitratedControlWriter(arbiter, {
      onResult: (write, result) => results.push([write, result]),
    }),
  })
  return { engine, document, renderer, arbiter, surface, clock, results }
}

describe('controlWriteToOperation', () => {
  const write = (target: ControlWrite['target'], value: number): ControlWrite => ({
    target,
    unit: 0.5,
    value,
    gesture: 'g',
  })

  it('maps strip, send, master and device targets to operations and unknown ones to null', () => {
    const score = demoScore()
    expect(
      controlWriteToOperation(
        score,
        write({ kind: 'strip', track: 'kick', control: 'level' }, 1.2),
      ),
    ).toEqual({
      type: 'strip.set',
      owner: 'kick',
      param: 'level',
      value: 1.2,
    })
    expect(
      controlWriteToOperation(score, write({ kind: 'strip', track: 'kick', control: 'mute' }, 1)),
    ).toEqual({
      type: 'strip.mute',
      owner: 'kick',
      mute: true,
    })
    expect(
      controlWriteToOperation(score, write({ kind: 'strip', track: 'kick', control: 'solo' }, 0)),
    ).toEqual({
      type: 'strip.solo',
      owner: 'kick',
      solo: false,
    })
    expect(
      controlWriteToOperation(score, write({ kind: 'send', track: 'kick', send: 'hall' }, 0.4)),
    ).toEqual({
      type: 'send.set',
      owner: 'kick',
      target: 'hall',
      level: 0.4,
    })
    expect(
      controlWriteToOperation(score, write({ kind: 'master', control: 'level' }, 0.7)),
    ).toEqual({
      type: 'strip.set',
      owner: 'master',
      param: 'level',
      value: 0.7,
    })
    expect(
      controlWriteToOperation(
        score,
        write({ kind: 'device', device: 'kick-filter', param: 'frequency' }, 800),
      ),
    ).toEqual({ type: 'device.setParam', device: 'kick-filter', param: 'frequency', value: 800 })
    expect(
      controlWriteToOperation(
        score,
        write({ kind: 'device', device: 'x', param: 'frequency' }, 800),
        () => 'kick-filter',
      ),
    ).toMatchObject({ device: 'kick-filter' })
    expect(
      controlWriteToOperation(score, write({ kind: 'strip', track: 'nope', control: 'level' }, 1)),
    ).toBeNull()
    expect(
      controlWriteToOperation(score, write({ kind: 'send', track: 'pad', send: 'hall' }, 1)),
    ).toBeNull()
    expect(
      controlWriteToOperation(score, write({ kind: 'device', device: 'nope', param: 'x' }, 1)),
    ).toBeNull()
    expect(controlWriteToOperation(score, write({ kind: 'macro', macro: 'm' }, 1))).toBeNull()
    expect(
      controlWriteToOperation(score, write({ kind: 'transport', action: 'start' }, 1)),
    ).toBeNull()
  })
})

describe('ControlSurface through the arbiter', () => {
  it('a CC move becomes a controller-authored strip.set the renderer ramps, and holds the target', async () => {
    const { surface, document, renderer, arbiter, results } = await rig()
    surface.map({ source: cc7, target: { kind: 'strip', track: 'kick', control: 'level' } })
    const fader = renderer.audioTrack('kick').strip.fader as unknown as MockGainNode
    const before = fader.gain.events.length
    const handled = surface.handle(absoluteEvent(cc7, 0.5))
    expect(handled.applied).toHaveLength(1)
    const entry = document.log.entries.at(-1)
    expect(entry?.op).toEqual({ type: 'strip.set', owner: 'kick', param: 'level', value: 0.75 })
    expect(entry?.author).toEqual({ id: 'controller', kind: 'controller' })
    expect(entry?.gesture).toBe('controller:strip:kick:level')
    await renderer.whenIdle()
    expect(fader.gain.events.length).toBe(before + 1)
    expect(fader.gain.lastEvent('setTargetAtTime')?.args[0]).toBe(0.75)
    expect(arbiter.stateOf('strip:kick:level').holder).toEqual({
      id: 'controller',
      kind: 'controller',
    })
    expect(results).toHaveLength(1)
    expect(results[0][1].outcome).toBe('applied')
    // Consecutive moves coalesce into one undo step under the controller gesture.
    surface.handle(absoluteEvent(cc7, 0.6))
    expect(document.history.undoStack).toHaveLength(1)
    expect(document.history.undoStack[0].count).toBe(2)
  })

  it('a target the score lacks falls back to the direct engine write; a lock drops the controller', async () => {
    const { surface, engine, document, arbiter, renderer, results } = await rig()
    engine.addAudioTrack('extra')
    surface.map({ source: cc10, target: { kind: 'strip', track: 'extra', control: 'pan' } })
    surface.handle(absoluteEvent(cc10, 1))
    expect(engine.track('extra').strip.pan).toBe(1)
    expect(document.log.length).toBe(0)
    expect(results).toEqual([])

    surface.map({ source: cc7, target: { kind: 'strip', track: 'kick', control: 'level' } })
    arbiter.lock('strip:kick:level', { author: { id: 'rails', kind: 'system' }, reason: 'fade' })
    const fader = renderer.audioTrack('kick').strip.fader as unknown as MockGainNode
    const before = fader.gain.events.length
    surface.handle(absoluteEvent(cc7, 0.1))
    await renderer.whenIdle()
    expect(results.at(-1)?.[1]).toMatchObject({ outcome: 'dropped', reason: 'locked' })
    expect(fader.gain.events.length).toBe(before)
    expect(findStripHost(document.score, 'kick')?.strip.level).toBe(0.8)
  })

  it('a hand on the UI and a controller are one class: the latest takes the hold; the agent waits for both', async () => {
    const { surface, arbiter, clock } = await rig()
    surface.map({ source: cc7, target: { kind: 'strip', track: 'kick', control: 'level' } })
    arbiter.apply(
      { type: 'strip.set', owner: 'kick', param: 'level', value: 0.5 },
      { author: human },
    )
    surface.handle(absoluteEvent(cc7, 0.2))
    expect(arbiter.stateOf('strip:kick:level').holder?.kind).toBe('controller')
    const coach = arbiter.apply(
      { type: 'strip.set', owner: 'kick', param: 'level', value: 0.1 },
      { author: { id: 'coach', kind: 'agent' } },
    )
    expect(coach.outcome).toBe('deferred')
    clock.ms = 5000
    arbiter.tick()
    expect(findStripHost(arbiter.score, 'kick')?.strip.level).toBe(0.1)
  })
})
