// The scripted "coach vs listener knob" session (U30, AE7, R29) on the
// recording mocks: the coach (agent), the listener at the UI (human), a MIDI
// fader (controller), a lane writing through the document (automation) and
// the rails (system) all move the music fader through the arbiter. The
// AudioParam events the engine records must be exactly the writes the
// policy table lets through, in order.

import { describe, expect, it } from 'vitest'

import {
  MockAudioBuffer,
  asAudioContext,
  createMockContext,
  type MockGainNode,
} from '../../testing'
import { AgentController } from '../../agent/AgentController'
import { duckerDescriptor, library, sessionScore } from '../../agent/__tests__/fixtures'
import { ControlSurface } from '../../core/control/ControlSurface'
import { absoluteEvent } from '../../core/control/event'
import { NODE_DEVICES } from '../../core/devices/native'
import { DeviceRegistry } from '../../core/devices/registry'
import { createEngine } from '../../core/Engine'
import { decide, DEFAULT_ARBITRATION_POLICY } from '../../core/params/arbitration'
import { Arbiter, type ArbiterEvent } from '../Arbiter'
import { arbitratedControlWriter } from '../controlWriter'
import { loadScore } from '../loadScore'
import { AUTOMATION_AUTHOR, SYSTEM_AUTHOR, type Author } from '../log'
import { type Operation } from '../operations'
import { ScoreDocument } from '../ScoreDocument'

const listener: Author = { id: 'listener', kind: 'human' }
const musicLevel = { kind: 'strip' as const, owner: 'music', param: 'level' as const }
const cc7 = { kind: 'cc' as const, channel: 1, controller: 7 }

const level = (value: number): Operation => ({ ...musicLevel, type: 'strip.set', value })

describe('coach vs listener knob', () => {
  it('the music fader receives exactly the writes the policy table admits, in order', async () => {
    const ctx = createMockContext({ sampleRate: 48000 })
    const engine = createEngine({
      context: asAudioContext(ctx),
      setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
      clearIntervalFn: () => {},
      devices: new DeviceRegistry([...NODE_DEVICES, duckerDescriptor()]),
    })
    await engine.samples.load(
      '201',
      new MockAudioBuffer(2, 48000 * 10, 48000) as unknown as AudioBuffer,
    )
    const clock = { ms: 0 }
    const document = new ScoreDocument(sessionScore(), { now: () => clock.ms })
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
    const coach = new AgentController({
      engine,
      document,
      arbiter,
      roles: { voice: 'voice', music: 'music' },
      library: library(),
      now: () => clock.ms,
      meters: () => null,
      author: { id: 'coach', kind: 'agent' },
    })
    const surface = new ControlSurface({ engine, write: arbitratedControlWriter(arbiter) })
    surface.map({ source: cc7, target: { kind: 'strip', track: 'music', control: 'level' } })
    const fader = renderer.audioTrack('music').strip.fader as unknown as MockGainNode
    const rendered = fader.gain.events.length // the initial render's own ramp to the score's 0.8
    const writtenLevels = (): number[] =>
      fader.gain.events
        .slice(rendered)
        .filter((event) => event.method === 'setTargetAtTime')
        .map((event) => Number((event.args[0] as number).toFixed(3)))
    const settle = async (ms: number): Promise<void> => {
      clock.ms = ms
      arbiter.tick()
      await renderer.whenIdle()
    }
    const policy = DEFAULT_ARBITRATION_POLICY

    // 0 s — the coach lowers the music: a free target, the agent applies.
    expect(decide(policy, 'agent', null)).toBe('apply')
    expect(coach.call('set_music_volume', { level: 0.3 }).ok).toBe(true)
    await settle(0)
    expect(writtenLevels()).toEqual([0.3])

    // 1 s — the listener grabs the fader and drags it up; the hand holds the target.
    arbiter.touch(musicLevel, listener)
    arbiter.apply(level(0.5), { author: listener, gesture: 'drag-1' })
    await settle(1200)
    arbiter.apply(level(0.9), { author: listener, gesture: 'drag-1' })
    await settle(1500)
    arbiter.release(musicLevel, listener)
    arbiter.endGesture()
    expect(writtenLevels()).toEqual([0.3, 0.5, 0.9])
    expect(arbiter.stateOf(musicLevel).holder).toEqual(listener)

    // 2 s — the coach tries again: held by the human, the agent defers. Nothing reaches the graph.
    expect(decide(policy, 'agent', 'human')).toBe('defer')
    const deferred = coach.call('set_music_volume', { level: 0.2 })
    expect(deferred.ok && deferred.rails[0]?.action).toBe('deferred')
    await settle(2000)
    expect(writtenLevels()).toEqual([0.3, 0.5, 0.9])

    // 2.5 s — a MIDI fader moves: same class as the hand, the latest writer wins and takes the hold.
    expect(decide(policy, 'controller', 'human')).toBe('apply')
    clock.ms = 2500
    surface.handle(absoluteEvent(cc7, 0.4)) // 0.4 × levelMax 1.5 = 0.6
    await settle(2500)
    expect(writtenLevels()).toEqual([0.3, 0.5, 0.9, 0.6])
    expect(arbiter.stateOf(musicLevel).holder?.kind).toBe('controller')

    // 3 s — automation writing through the document is dropped while a hand holds.
    expect(decide(policy, 'automation', 'controller')).toBe('drop')
    expect(arbiter.apply(level(0.1), { author: AUTOMATION_AUTHOR }).outcome).toBe('dropped')
    await settle(3000)
    expect(writtenLevels()).toEqual([0.3, 0.5, 0.9, 0.6])

    // 3.5 s — the rails clamp: the system lands through the hold and leaves it in place.
    expect(decide(policy, 'system', 'controller')).toBe('apply')
    expect(arbiter.apply(level(0.55), { author: SYSTEM_AUTHOR }).outcome).toBe('applied')
    await settle(3500)
    expect(writtenLevels()).toEqual([0.3, 0.5, 0.9, 0.6, 0.55])
    expect(arbiter.stateOf(musicLevel).holder?.kind).toBe('controller')

    // 4 s — the coach's newer intent supersedes its waiting one; still one pending write.
    expect(coach.call('set_music_volume', { level: 0.25 }).ok).toBe(true)
    expect(arbiter.pending().map((pending) => pending.label?.split(' ')[0])).toEqual([
      'agent:set_music_volume#3',
    ])
    expect(events.filter((event) => event.type === 'dropped').map((event) => event.reason)).toEqual(
      ['held', 'superseded'],
    )

    // 7.5 s — the controller's hold (2.5 s + 5 s) lapses: the coach's fresh write lands, attributed to it.
    await settle(7499)
    expect(writtenLevels()).toEqual([0.3, 0.5, 0.9, 0.6, 0.55])
    await settle(7500)
    expect(writtenLevels()).toEqual([0.3, 0.5, 0.9, 0.6, 0.55, 0.25])
    expect(document.log.entries.at(-1)).toMatchObject({
      author: { kind: 'agent', id: 'coach' },
      label: expect.stringMatching(/^agent:set_music_volume#3/) as string,
    })

    // 8 s — the rails lock the fader for a fade-out: the listener is refused, the coach waits.
    clock.ms = 8000
    arbiter.lock(musicLevel, { author: SYSTEM_AUTHOR, ttlMs: 2000, reason: 'fade-out' })
    expect(decide(policy, 'human', 'system')).toBe('drop')
    expect(arbiter.apply(level(0.9), { author: listener }).outcome).toBe('dropped')
    expect(decide(policy, 'agent', 'system')).toBe('defer')
    expect(coach.call('set_music_volume', { level: 0.35 }).ok).toBe(true)
    await settle(9999)
    expect(writtenLevels()).toEqual([0.3, 0.5, 0.9, 0.6, 0.55, 0.25])

    // 10 s — the lock lapses: the coach lands.
    await settle(10_000)
    expect(writtenLevels()).toEqual([0.3, 0.5, 0.9, 0.6, 0.55, 0.25, 0.35])

    // The log attributes every landed write; AE7's undo brings the coach's earlier value back.
    expect(document.log.entries.map((entry) => entry.author.kind)).toEqual([
      'agent',
      'human',
      'human',
      'controller',
      'system',
      'agent',
      'agent',
    ])
    document.undo()
    document.undo()
    document.undo() // the rails' clamp
    document.undo() // the controller move
    document.undo() // the listener's drag (one step)
    await renderer.whenIdle()
    expect(writtenLevels().at(-1)).toBe(0.3)
    engine.dispose()
  })
})
