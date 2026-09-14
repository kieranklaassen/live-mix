// The agent through the arbiter (U30): a held target defers or refuses the
// coach's write, the audit and the result say so, and a deferred write lands
// with the agent's label once the listener lets go.

import { describe, expect, it, vi } from 'vitest'

import { MockAudioBuffer, asAudioContext, createMockContext } from '../../testing'
import { NODE_DEVICES } from '../../core/devices/native'
import { DeviceRegistry } from '../../core/devices/registry'
import { createEngine } from '../../core/Engine'
import { Arbiter, type ArbiterEvent, type ArbiterOptions } from '../../score/Arbiter'
import { loadScore } from '../../score/loadScore'
import { type Author } from '../../score/log'
import { findStripHost } from '../../score/schema'
import { ScoreDocument } from '../../score/ScoreDocument'
import { VersionHistory } from '../../score/versions'
import { AgentController } from '../AgentController'
import { type ToolFailure, type ToolSuccess } from '../types'
import { withVersionCheckpoints } from '../versionCheckpoints'
import { duckerDescriptor, library, sessionScore } from './fixtures'

const listener: Author = { id: 'listener', kind: 'human' }

async function rig(policy: ArbiterOptions = {}) {
  const ctx = createMockContext({ sampleRate: 48000 })
  const engine = createEngine({
    context: asAudioContext(ctx),
    setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
    clearIntervalFn: () => {},
    devices: new DeviceRegistry([...NODE_DEVICES, duckerDescriptor()]),
  })
  const buffer = new MockAudioBuffer(2, 48000 * 10, 48000) as unknown as AudioBuffer
  await engine.samples.load('201', buffer)
  const clock = { ms: 1_000_000 }
  const document = new ScoreDocument(sessionScore(), { now: () => clock.ms })
  const renderer = loadScore(engine, document, { onError: () => {} })
  await renderer.whenIdle()
  const arbiter = new Arbiter(document, {
    now: () => clock.ms,
    renderer,
    setTimeoutFn: () => 0,
    clearTimeoutFn: () => {},
    ...policy,
  })
  const events: ArbiterEvent[] = []
  arbiter.onChange((event) => events.push(event))
  const controller = new AgentController({
    engine,
    document,
    arbiter,
    roles: { voice: 'voice', music: 'music' },
    library: library(),
    now: () => clock.ms,
    meters: () => null,
  })
  const level = (): number => findStripHost(document.score, 'music')?.strip.level ?? NaN
  return { document, arbiter, controller, clock, events, level, engine }
}

describe('AgentController through the arbiter', () => {
  it('a free target applies as before, attributed to the agent', async () => {
    const { controller, document, level } = await rig()
    const result = controller.call('set_music_volume', { level: 0.4 }) as ToolSuccess
    expect(result.ok).toBe(true)
    expect(result.operations).toEqual([{ seq: 1, type: 'strip.set' }])
    expect(result.rails).toEqual([])
    expect(document.log.entry(1)?.author.kind).toBe('agent')
    expect(level()).toBe(0.4)
  })

  it('a target the listener holds defers the call: ok, no operations, an arbitration note, lands later', async () => {
    const { controller, arbiter, clock, level, document } = await rig()
    arbiter.apply(
      { type: 'strip.set', owner: 'music', param: 'level', value: 0.9 },
      { author: listener },
    )
    clock.ms += 1000
    const result = controller.call('set_music_volume', { level: 0.3 }) as ToolSuccess
    expect(result.ok).toBe(true)
    expect(result.operations).toEqual([])
    expect(result.result).toEqual({ level: 0.3, deferred: 1 })
    expect(result.rails).toEqual([
      {
        rail: 'arbitration',
        action: 'deferred',
        message:
          'strip.set on strip:music:level is held by human "listener"; it lands when the hold ends',
      },
    ])
    expect(controller.audit.entries.at(-1)?.summary).toContain('arbitration')
    expect(level()).toBe(0.9)

    clock.ms += 4000
    arbiter.tick()
    expect(level()).toBe(0.3)
    const landed = document.log.entries.at(-1)
    expect(landed?.author.kind).toBe('agent')
    expect(landed?.label).toMatch(/^agent:set_music_volume#1 /)
  })

  it("with onHeld.agent = 'drop' the call is rejected with the holder in the message", async () => {
    const { controller, arbiter, clock, level } = await rig({ onHeld: { agent: 'drop' } })
    arbiter.touch({ kind: 'strip', owner: 'music', param: 'level' }, listener)
    const refused = controller.call('set_music_volume', { level: 0.3 }) as ToolFailure
    expect(refused.ok).toBe(false)
    expect(refused.error.code).toBe('rejected')
    expect(refused.error.message).toContain('held by human "listener"')
    expect(refused.rails[0]).toMatchObject({ rail: 'arbitration', action: 'rejected' })
    expect(level()).toBe(0.8)
    arbiter.release(undefined, listener)
    clock.ms += 5000
    arbiter.tick()
    expect(controller.call('set_music_volume', { level: 0.3 }).ok).toBe(true)
    expect(level()).toBe(0.3)
  })

  it('a batch is one write: held as a whole, and a stale-by-then batch drops as failed when it lands', async () => {
    const { controller, arbiter, clock, document, events, level } = await rig()
    controller.grantConsent('arrange')
    arbiter.touch({ kind: 'strip', owner: 'music', param: 'level' }, listener)
    const before = document.log.length
    const deferred = controller.call('batch', {
      ops: [
        { type: 'strip.set', owner: 'voice', param: 'level', value: 0.6 },
        { type: 'strip.set', owner: 'music', param: 'level', value: 0.1 },
        { type: 'clip.remove', track: 'music', id: 'no-such-clip' },
      ],
    }) as ToolSuccess
    expect(deferred.ok).toBe(true)
    expect(deferred.result.deferred).toBe(1)
    expect(document.log.length).toBe(before)
    arbiter.release(undefined, listener)
    clock.ms += 5000
    arbiter.tick()
    expect(events.at(-1)).toMatchObject({ type: 'dropped', reason: 'failed' })
    expect(document.log.length).toBe(before)
    expect(level()).toBe(0.8)
  })

  it('a failing multi-operation tool cancels its deferred writes and rolls back the applied ones', async () => {
    const { controller, arbiter, document, level } = await rig()
    controller.registry.register({
      definition: {
        name: 'three_step',
        description: 'test',
        parameters: { type: 'object', properties: {}, additionalProperties: false },
        category: 'operation',
      },
      available: () => true,
      plan: () => ({
        operations: [
          { type: 'strip.set', owner: 'voice', param: 'level', value: 0.6 },
          { type: 'strip.set', owner: 'music', param: 'level', value: 0.1 },
          { type: 'clip.remove', track: 'music', id: 'no-such-clip' },
        ],
        effects: [],
        result: {},
        label: 'three steps',
      }),
    })
    arbiter.touch({ kind: 'strip', owner: 'music', param: 'level' }, listener)
    const failed = controller.call('three_step', {}) as ToolFailure
    expect(failed.ok).toBe(false)
    expect(failed.error.code).toBe('failed')
    expect(arbiter.pending()).toEqual([])
    expect(failed.rails.map((note) => note.action)).toEqual(['deferred'])
    // The voice write applied and was rolled back; the music write never reached the log.
    expect(document.log.entries.map((entry) => entry.label)).toEqual([
      'agent:three_step#1 three steps',
      'rollback agent:three_step#1 three steps',
    ])
    expect(findStripHost(document.score, 'voice')?.strip.level).toBe(1)
    expect(level()).toBe(0.8)
  })

  it('the agent undo tool is arbitrated too', async () => {
    const { controller, arbiter, clock, level } = await rig()
    controller.call('set_music_volume', { level: 0.4 })
    clock.ms += 2000
    arbiter.touch({ kind: 'strip', owner: 'music', param: 'level' }, listener)
    const undo = controller.undo() as ToolSuccess
    expect(undo.ok).toBe(true)
    expect(undo.rails[0]?.action).toBe('deferred')
    expect(level()).toBe(0.4)
  })

  it('refuses an arbiter over a different document', async () => {
    const { arbiter } = await rig()
    expect(
      () => new AgentController({ document: new ScoreDocument(sessionScore()), arbiter }),
    ).toThrow(/must wrap/)
  })
})

describe('withVersionCheckpoints', () => {
  it('saves a section checkpoint on advance and an end checkpoint on fade-out, passing the hooks through', async () => {
    const { document, clock } = await rig()
    let counter = 0
    const versions = new VersionHistory(document, {
      now: () => clock.ms,
      id: () => `v${++counter}`,
    })
    let section = 0
    const fadeOut = vi.fn()
    const session = withVersionCheckpoints(
      { advanceSection: () => ++section, fadeOut, extendSection: (seconds) => seconds },
      versions,
    )
    const controller = new AgentController({ document, session, now: () => clock.ms })
    expect(controller.call('advance_section', {}).ok).toBe(true)
    expect(session.extendSection?.(10)).toBe(10)
    clock.ms += 60_000
    expect(controller.call('advance_section', {}).ok).toBe(true)
    clock.ms += 60_000
    expect(controller.call('fade_out', { seconds: 5 }).ok).toBe(true)
    expect(fadeOut).toHaveBeenCalledWith(5)
    expect(versions.list().map((version) => [version.milestone, version.label])).toEqual([
      ['start', 'Session start'],
      ['section', 'Section 2'],
      ['section', 'Section 3'],
      ['end', 'Session end'],
    ])
    // Opt out per milestone; a session without the hooks is returned as is.
    const quiet = withVersionCheckpoints({ advanceSection: () => 0 }, versions, {
      onAdvance: false,
    })
    quiet.advanceSection?.()
    expect(versions.list()).toHaveLength(4)
    expect(withVersionCheckpoints({}, versions)).toEqual({})
  })
})
